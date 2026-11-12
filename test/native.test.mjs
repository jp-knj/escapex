import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { test } from 'node:test';
import * as api from '../dist/native.mjs';
import * as esm from '../dist/index.mjs';
import { nativePlatform } from '../src/native-platform.ts';
import { verifyEscape, verifyContexts } from './fixtures/wasm-check.mjs';
import { verifyUnescape } from './fixtures/unescape-check.mjs';
import { cases as selectionCases } from './fixtures/native-selection-cases.mjs';

test('native: all public functions, complete UTF-16 range, boundaries and large inputs', () => {
	assert.deepEqual(Object.keys(api), Object.keys(esm));
	assert.equal(api.escape, api.escapeHTML);
	assert.equal(api.unescape, api.unescapeHTML);
	assert(verifyEscape(api.escape) > 70000);
	assert(verifyContexts(api) > 140000);
	assert(verifyUnescape(api) > 65000);
	for (const name of Object.keys(esm)) {
		for (const value of [undefined, null, 1, true, 1n, Symbol(), {}, [], new String('&')]) {
			let expected;
			try { esm[name](value); } catch (error) { expected = error; }
			assert.throws(() => api[name](value), { name: 'TypeError', message: expected.message });
		}
	}
});

test('native: Workers use independent call buffers', async () => {
	await Promise.all(Array.from({ length: 4 }, (_, index) => new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./fixtures/native-worker.mjs', import.meta.url), {
			workerData: { specifier: new URL('../dist/native.mjs', import.meta.url).href, index },
		});
		worker.on('error', reject);
		worker.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Worker exit ${code}`)));
	})));
});

test('native: selection boundaries and distributions preserve every UTF-16 unit', () => {
	for (const [name, value] of Object.entries(selectionCases)) {
		assert.equal(api.escapeHTML(value), esm.escapeHTML(value), name);
	}
});

test('native: short and no-op paths never cross Node-API and validation precedes scanning', async () => {
	const dir = await realpath(await mkdtemp(join(tmpdir(), 'html escape native ')));
	const require = createRequire(import.meta.url);
	const libc = process.platform === 'linux' ? (process.report.getReport().header.glibcVersionRuntime ? 'gnu' : 'musl') : undefined;
	const binary = join(dir, 'native', `escape_html.${nativePlatform(process.platform, process.arch, libc)}.node`);
	try {
		await mkdir(join(dir, 'native'));
		await copyFile(new URL('../dist/native.mjs', import.meta.url), join(dir, 'native.mjs'));
		await copyFile(new URL('../dist/escape-core.mjs', import.meta.url), join(dir, 'escape-core.mjs'));
		await writeFile(binary, '');
		const calls = [];
		require.cache[binary] = { exports: Object.fromEntries(['escapeHtml', 'escapeText', 'escapeAttribute', 'unescapeHtml'].map((name) => [name, (value) => { calls.push(name); return value; }])) };
		const stub = await import(pathToFileURL(join(dir, 'native.mjs')));
		for (const name of Object.keys(stub)) {
			assert.equal(stub[name]('plain 日本語😀\0\ud800'), 'plain 日本語😀\0\ud800');
			assert.throws(() => stub[name]({ toString() { throw Error('coerced'); } }), TypeError);
		}
		assert.equal(stub.escapeText('\'"\r\n'), '\'"\r\n');
		assert.equal(stub.unescape('&AMP;&#x26;&#13;'), '&AMP;&#x26;&#13;');
		assert.deepEqual(calls, []);
		for (const name of Object.keys(stub)) {
			for (const value of ['&<>\'"\r\n\ud800\udfff', '&amp;&lt;&#39;', 'a'.repeat(254) + '&']) {
				assert.equal(stub[name](value), esm[name](value));
			}
			assert.equal(stub[name]('x'.repeat(1024)), 'x'.repeat(1024));
		}
		for (const length of [128, 256, 8192]) {
			for (const value of ['<' + 'a'.repeat(length - 1), '<' + 'a'.repeat(length - 2) + '>']) {
				assert.equal(stub.escape(value), esm.escape(value));
			}
		}
		assert.deepEqual(calls, []);
		stub.escape('&'.repeat(128));
		assert.deepEqual(calls, ['escapeHtml']);
		calls.length = 0;
		stub.escape('&'.repeat(256)); stub.escapeText('<'.repeat(256));
		stub.escapeAttribute('\r'.repeat(256)); stub.unescape('&amp;'.repeat(52));
		assert.deepEqual(calls, ['escapeHtml', 'escapeText', 'escapeAttribute', 'unescapeHtml']);
	} finally {
		delete require.cache[binary];
		await rm(dir, { recursive: true, force: true });
	}
});

test('native: both sides of the JS/native cutoff preserve all UTF-16 units', () => {
	for (const length of [127, 128, 129, 254, 255, 256, 257, 511, 512]) {
		for (const needle of ['&', '<', '>', "'", '"', '\r', '\n', '&amp;']) {
			for (const index of [0, Math.min(127, length - needle.length), length - needle.length]) {
				const input = '\ud800'.repeat(index) + needle + '\udfff'.repeat(length - index - needle.length);
				for (const name of Object.keys(esm)) assert.equal(api[name](input), esm[name](input));
			}
		}
	}
	const all = Array.from({ length: 65536 }, (_, value) => String.fromCharCode(value)).join('');
	for (const name of Object.keys(esm)) assert.equal(api[name](`${all}&amp;${all}`), esm[name](`${all}&amp;${all}`));
});

test('native: platform selection covers both architectures and libc variants', () => {
	for (const arch of ['arm64', 'x64']) {
		assert.equal(nativePlatform('darwin', arch), `darwin-${arch}`);
		assert.equal(nativePlatform('win32', arch), `win32-${arch}-msvc`);
		for (const libc of ['gnu', 'musl']) assert.equal(nativePlatform('linux', arch, libc), `linux-${arch}-${libc}`);
	}
	for (const args of [['darwin', 'ia32'], ['freebsd', 'x64'], ['linux', 'arm64'], ['linux', 'x64', 'other']]) {
		assert.throws(() => nativePlatform(...args), /Unsupported native/);
	}
});

test('native: returned strings survive buffer reuse, collection and capacity changes', () => {
	const retained = [];
	const sizes = [256, 8192, 1, 4096, 700000, 255, 128, 16384, 0, 1024];
	for (let round = 0; round < 3; round++) {
		const pattern = '&<>\'"\r\n日本語😀\ud800\udfff\0' + round;
		for (const size of sizes) {
			const input = pattern.repeat(Math.ceil(size / pattern.length)).slice(0, size);
			for (const name of ['escapeHTML', 'escapeText', 'escapeAttribute', 'unescape']) {
				const value = name === 'unescape' ? '&amp;'.repeat(Math.ceil(size / 5)).slice(0, size) : input;
				retained.push([api[name](value), esm[name](value)]);
			}
			global.gc?.();
			for (const [actual, expected] of retained) assert.equal(actual, expected);
		}
	}
});
