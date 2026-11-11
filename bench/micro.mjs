import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { loadImplementation } from './implementations.mjs';

const variant = process.argv[2];
global.gc?.();
const memoryBefore = process.memoryUsage();
const start = performance.now();
const api = await loadImplementation(variant);
const importMs = performance.now() - start;
const memoryAfterImport = process.memoryUsage();
const reference = await loadImplementation('esm');
const cases = {
	short: 'A < B & "quoted"',
	'unchanged-short': 'plain text without special characters',
	'unchanged-long': 'plain text without special characters '.repeat(4096),
	'quoted-json': JSON.stringify(Array.from({ length: 512 }, (_, id) => ({ id, title: 'item "title"', html: '<a href="/">&</a>' }))),
	'japanese-emoji': '日本語と絵文字😀 <span title="引用">本文 & 続き</span>\r\n'.repeat(1024),
	'long-body': ('a paragraph without markup '.repeat(100) + '<a href="/a?x=1&y=2">link</a>\n').repeat(128),
	'dense-quotes': '\'"&<>\r\n'.repeat(4096),
};
let checksum = 0;
const measurements = [];
for (const [name, input] of Object.entries(cases)) {
	for (const operation of ['escapeHTML', 'escapeText', 'escapeAttribute', 'unescapeHTML']) {
		const value = operation === 'unescapeHTML' ? reference.escape(input) : input;
		assert.equal(api[operation](value), reference[operation](value));
		const fn = api[operation];
		const batch = Math.max(1, Math.min(256, Math.ceil(65536 / value.length)));
		const consume = () => { for (let i = 0; i < batch; i++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0; };
		const warm = performance.now();
		do { consume(); } while (performance.now() - warm < 30);
		global.gc?.();
		let iterations = 0;
		const before = performance.now();
		do { consume(); iterations += batch; } while (performance.now() - before < 150);
		const elapsedMs = performance.now() - before;
		measurements.push({ name, operation, inputUnits: value.length, iterations, nsPerCall: elapsedMs * 1e6 / iterations });
	}
}
global.gc?.();
console.log(JSON.stringify({ variant, importMs, memoryBefore, memoryAfterImport, memoryAfter: process.memoryUsage(),
	maxRssKiB: process.resourceUsage().maxRSS, checksum, measurements }));
