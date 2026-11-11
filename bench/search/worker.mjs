import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import * as before from '../fixtures/escape-before-search.mjs';

const variant = process.argv[2];
const api = variant === 'before' ? before : await import(variant === 'esm' ? '../../dist/index.mjs' : '../../dist/native.mjs');
const fn = api.escapeHTML;
const cases = {
	'given-16': 'A < B & "quoted"',
	'plain-16': 'abcdefghijklmnop',
	'first-16': '<abcdefghijklmno',
	'last-16': 'abcdefghijklmno<',
	'dense-16': '&<>"'.repeat(4),
	'unicode-short': '日本語😀 <&"本文">',
	'first-31': '<' + 'a'.repeat(30),
	'dense-31': '&<>"'.repeat(7) + '&<>',
	'first-32': '<' + 'a'.repeat(31),
	'first-64': '<' + 'a'.repeat(63),
	'last-64': 'a'.repeat(63) + '&',
	'plain-255': 'a'.repeat(255),
	'first-255': '<' + 'a'.repeat(254),
	'dense-255': '&<>"'.repeat(63) + '&<>',
	'first-256': '<' + 'a'.repeat(255),
	'plain-8192': 'a'.repeat(8192),
	'sparse-8192': '<' + 'a'.repeat(8190) + '>',
};
let checksum = 0;
const measurements = [];
for (const [name, value] of Object.entries(cases)) {
	assert.equal(fn(value), before.escapeHTML(value), `${variant}/${name}`);
	const batch = Math.max(1, Math.min(256, Math.ceil(65536 / value.length)));
	function consume() {
		for (let i = 0; i < batch; i++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0;
	}
	const warmStart = performance.now();
	let warmIterations = 0;
	const minimumWarmup = value.length < 256 ? 10000 : 32;
	do { consume(); warmIterations += batch; } while (performance.now() - warmStart < 100 || warmIterations < minimumWarmup);
	global.gc?.();
	const start = performance.now();
	let iterations = 0;
	do { consume(); iterations += batch; } while (performance.now() - start < 200);
	measurements.push({ name, inputUnits: value.length, warmIterations, iterations,
		nsPerCall: (performance.now() - start) * 1e6 / iterations });
}
console.log(JSON.stringify({ variant, measurements, checksum }));
