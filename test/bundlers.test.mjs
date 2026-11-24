import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { preparePackage, bundleConsumer, packageName, root } from '../scripts/package-fixture.mjs';

let fixture;
before(async () => { fixture = await preparePackage(); });
after(async () => { if (fixture) await rm(fixture.consumer, { recursive: true, force: true }); });

for (const tool of ['rolldown', 'vite']) {
	for (const ssr of [false, true]) {
		test(`${tool}: packed ESM and Wasm in ${ssr ? 'SSR' : 'browser-targeted'} bundle`, async () => {
			const { outDir, output } = await bundleConsumer(fixture.consumer, tool, { ssr });
			const js = output.find((entry) => entry.type === 'chunk');
			// Node-target Rolldown metadata can include its eliminated node:module shim.
			assert(js.imports.every((specifier) => ssr && specifier === 'node:module'));
			assert.doesNotMatch(js.code, /node:|createRequire|process\.|\.node\b/);
			const url = pathToFileURL(join(outDir, 'index.mjs'));
			const api = await import(url);
			const wasm = ssr ? join(fixture.installed, 'dist/escape_html.wasm') : new URL(api.optimizedUrl, url);
			await api.wasm.init(await readFile(wasm));
			for (const implementation of [api.js, api.wasm]) {
				assert(api.verifyEscape(implementation.escape) > 70000);
				assert(api.verifyContexts(implementation) > 140000);
				assert(api.verifyUnescape(implementation) > 65000);
			}
		});
	}
	test(`${tool}: removes unused ESM and Wasm imports`, async () => {
		const { output } = await bundleConsumer(fixture.consumer, tool, { unused: true });
		assert.equal(output.length, 1);
		assert(!Object.keys(output[0].modules).some((id) => id.startsWith(fixture.installed)));
		assert.doesNotMatch(output[0].code, /WebAssembly|escapeHTML|&amp;/);
	});
}

test('packed declarations resolve in Bundler and NodeNext modes', async () => {
	for (const mode of ['Bundler', 'NodeNext']) {
		const file = join(fixture.consumer, `${mode}.mts`);
		await writeFile(file, `
import { escape, unescape, escapeHTML, unescapeHTML, escapeText, escapeAttribute } from '${packageName}';
import { init, escape as wasmEscape, unescape as wasmUnescape,
  escapeText as wasmText, escapeAttribute as wasmAttribute } from '${packageName}/wasm';
import { escape as nativeEscape, escapeHTML as nativeHTML, unescape as nativeUnescape,
  unescapeHTML as nativeUnescapeHTML, escapeText as nativeText, escapeAttribute as nativeAttribute } from '${packageName}/native';
const ready: Promise<void> = init(new Uint8Array());
for (const fn of [escape, unescape, escapeHTML, unescapeHTML, escapeText, escapeAttribute,
  wasmEscape, wasmUnescape, wasmText, wasmAttribute,
  nativeEscape, nativeHTML, nativeUnescape, nativeUnescapeHTML, nativeText, nativeAttribute]) {
  const result: string = fn('&');
  // @ts-expect-error Only primitive strings are accepted.
  fn(123);
}
// @ts-expect-error Uint8Array only.
init('module.wasm');
`);
		execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict',
			'--target', 'ES2022', '--module', mode === 'Bundler' ? 'ESNext' : mode, '--moduleResolution', mode, file],
			{ cwd: fixture.consumer, stdio: 'pipe' });
	}
});

test('installed package works in a separate Node process without development dependencies', () => {
	execFileSync(process.execPath, ['--input-type=module', '-e', `
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escape, unescape } from '${packageName}';
import * as wasm from '${packageName}/wasm';
await wasm.init(await readFile(new URL(import.meta.resolve('${packageName}/escape_html.scalar.wasm'))));
for (const api of [{ escape, unescape }, wasm]) {
  assert.equal(api.escape('&<'), '&amp;&lt;');
  assert.equal(api.unescape('&amp;lt;'), '&lt;');
  assert.equal(api.unescape(api.escape('日本語\ud800&')), '日本語\ud800&');
}
`], { cwd: fixture.consumer, stdio: 'pipe' });
});
