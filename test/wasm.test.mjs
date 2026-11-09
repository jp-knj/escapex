import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { verifyEscape, verifyContexts } from './fixtures/wasm-check.mjs';
import { verifyUnescape } from './fixtures/unescape-check.mjs';
import { unescape as referenceUnescape } from 'html-escaper';

for (const variant of ['scalar', 'optimized']) {
	const url = new URL(`../dist/wasm.mjs?variant=${variant}`, import.meta.url);
	const bytes = await readFile(new URL(`../dist/escape_html${variant === 'scalar' ? '.scalar' : ''}.wasm`, import.meta.url));
	test(`Wasm ${variant}: initialization, UTF-16, growth and input types`, async () => {
		const api = await import(url);
		assert.throws(() => api.escapeHTML('&'), /init/);
		assert.throws(() => api.unescape('&amp;'), /init/);
		assert.throws(() => api.escapeText('plain'), /init/);
		assert.throws(() => api.escapeAttribute(''), /init/);
		await assert.rejects(api.init(new Uint8Array([0])), WebAssembly.CompileError);
		await assert.rejects(api.init(null), TypeError);
		await assert.rejects(api.init(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])), /Invalid/);
		const first = api.init(bytes);
		assert.equal(api.init(bytes), first);
		await first;
		assert.equal(api.init(bytes), first);
		assert(verifyEscape(api.escapeHTML) > 70000);
		assert(verifyContexts(api) > 140000);
		assert.equal(api.escape, api.escapeHTML);
		assert.equal(api.unescape, api.unescapeHTML);
		assert(verifyUnescape(api) > 65000);
		const pieces = ['&amp;', '&lt;', '&gt;', '&#39;', '&quot;', '&amp;lt;', '&apos;', '&#38;', '&#60;', '&#62;', '&#34;', '&#x26;', '&AMP;', '&amp', '\ud800', '&'];
		let seed = 0x12345678;
		const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
		for (let sample = 0; sample < 5000; sample++) {
			let input = '';
			for (let i = 0, length = random() % 64; i < length; i++) input += pieces[random() % pieces.length];
			assert.equal(api.unescape(input), referenceUnescape(input));
		}
	});
	test(`Wasm ${variant}: import-free ABI, bounds and reuse`, async () => {
		const module = await WebAssembly.compile(bytes);
		assert.deepEqual(WebAssembly.Module.imports(module), []);
		const { exports: w } = await WebAssembly.instantiate(module);
		const error = 0xffff_ffff;
		assert.equal(w.escape(1) >>> 0, error);
		assert.equal(w.unescape(1) >>> 0, error);
		assert.equal(w.escape_text(1) >>> 0, error);
		assert.equal(w.escape_attribute(1) >>> 0, error);
		assert.equal(w.reserve_input(error) >>> 0, error);
		const before = w.memory.buffer.byteLength;
		const length = 1024 * 1024;
		const pointer = w.reserve_input(length) >>> 0;
		new Uint16Array(w.memory.buffer, pointer, length).fill(34);
		assert.equal(w.escape(length), length * 6);
		const peak = w.memory.buffer.byteLength;
		assert(peak > before);
		assert.equal(w.escape(length) >>> 0, error); // Reservation consumed.
		const next = w.reserve_input(1) >>> 0;
		new Uint16Array(w.memory.buffer, next, 1)[0] = 38;
		assert.equal(w.escape(1), 5);
		assert.equal(w.memory.buffer.byteLength, peak);
		assert.equal(String.fromCharCode(...new Uint16Array(w.memory.buffer, next + 2, 5)), '&amp;');
		w.reserve_input(1);
		assert.equal(w.escape(2) >>> 0, error);
		const p = w.reserve_input(5) >>> 0;
		new Uint16Array(w.memory.buffer, p, 5).set([38, 97, 109, 112, 59]);
		assert.equal(w.unescape(5), 1);
		assert.equal(new Uint16Array(w.memory.buffer, p + 10, 1)[0], 38);
		assert.equal(w.unescape(5) >>> 0, error);
		for (const [operation, expected] of [
			['escape_text', '\"\'\r\n&lt;'],
			['escape_attribute', '&quot;&#39;&#13;&#10;&lt;'],
		]) {
			const at = w.reserve_input(5) >>> 0;
			new Uint16Array(w.memory.buffer, at, 5).set([34, 39, 13, 10, 60]);
			const size = w[operation](5);
			assert.equal(String.fromCharCode(...new Uint16Array(w.memory.buffer, at + 10, size)), expected);
			assert.equal(w[operation](5) >>> 0, error);
		}
	});
}
