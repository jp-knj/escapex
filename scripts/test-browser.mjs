import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preparePackage, bundleConsumer } from './package-fixture.mjs';

const fixture = await preparePackage();
const base = 'http://html-escape.test';
try {
	const bundles = [];
	for (const tool of ['rolldown', 'vite']) bundles.push(await bundleConsumer(fixture.consumer, tool));
	for (const [name, engine] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
		const override = process.env[`${name.toUpperCase()}_EXECUTABLE`];
		const browser = await engine.launch({ headless: true, ...(override ? { executablePath: override } : {}) });
		try {
			for (const bundle of bundles) {
				for (const variant of ['optimized', 'scalar']) {
					const page = await browser.newPage();
					try {
						await page.route(`${base}/**`, async (route) => {
							const pathname = new URL(route.request().url()).pathname;
							if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>html-escape tests</title>' });
							const path = resolve(fixture.consumer, '.' + pathname);
							if (!path.startsWith(fixture.consumer + sep)) return route.fulfill({ status: 403 });
							try { await route.fulfill({ contentType: extname(path) === '.wasm' ? 'application/wasm' : 'text/javascript', body: await readFile(path) }); }
							catch { await route.fulfill({ status: 404 }); }
						});
						await page.goto(base);
						const result = await page.evaluate(async ({ url, variant }) => {
							const api = await import(url);
							const response = await fetch(new URL(api[`${variant}Url`], url));
							if (!response.ok) throw new Error(`Wasm fetch failed: ${response.status}`);
							await api.wasm.init(new Uint8Array(await response.arrayBuffer()));
							// Verify actual HTML parser behavior, not just string substitutions.
							for (const implementation of [api.js, api.wasm]) {
								const host = document.createElement('div');
								for (const value of ['<b>日本語 & 😀</b>', '" data-extra="value', "' data-extra='value", '&lt;&#13;']) {
									host.innerHTML = implementation.escapeText(value);
									if (host.textContent !== value || host.children.length !== 0) throw new Error('Text round trip failed');
								}
								for (const quote of ['"', "'"]) {
									for (const value of ['\r', '\n', '\r\n', 'one\rtwo\r\nthree\nfour\t', '<b>"\' & 日本語 😀', '&amp;&#13;']) {
										host.innerHTML = `<span data-value=${quote}${implementation.escapeAttribute(value)}${quote}></span>`;
										const element = host.firstElementChild;
										if (host.children.length !== 1 || element.attributes.length !== 1 || element.childNodes.length !== 0
											|| element.getAttribute('data-value') !== value) throw new Error('Attribute round trip failed');
									}
								}
							}
							return [api.js, api.wasm].map((implementation) => ({
								escape: api.verifyEscape(implementation.escape), unescape: api.verifyUnescape(implementation),
								contexts: api.verifyContexts(implementation),
							}));
						}, { url: `${base}/${bundle.name}/index.mjs`, variant });
						assert(result.every((counts) => counts.escape > 70000 && counts.unescape > 65000 && counts.contexts > 140000));
						console.log(`${name} ${browser.version()} / ${bundle.name} / ${variant}: passed`);
					} finally { await page.close(); }
				}
			}
		} finally { await browser.close(); }
	}
} finally { await rm(fixture.consumer, { recursive: true, force: true }); }
