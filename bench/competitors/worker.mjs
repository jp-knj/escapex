import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { escapeHTML as reference } from '../../dist/index.mjs';
import { loadImplementation } from '../implementations.mjs';
import { cases } from './cases.mjs';

const variant = process.argv[2];
const loaders = {
	esm: async () => reference,
	wasm: async () => (await loadImplementation('wasm')).escapeHTML,
	native: async () => (await import('../../dist/native.mjs')).escapeHTML,
	'escape-html': async () => (await import('escape-html')).default,
	'fast-escape-html': async () => (await import('fast-escape-html')).escapeHTML,
	'html-escaper': async () => (await import('html-escaper')).escape,
	'@napi-rs/escape': async () => (await import('@napi-rs/escape')).escapeHTML,
};
const fn = await loaders[variant]();
// Compare equivalent HTML outside the timed region. The native competitor
// uses a different apostrophe spelling and also escapes forward slashes.
const normalize = (s) => s.replaceAll('&#x27;', '&#39;').replaceAll('&#x2f;', '/');

const probe = '\ud800&<>\'"\0\udfff';
const compatibility = { preservesLoneSurrogates: normalize(fn(probe)) === reference(probe),
	identicalEntitySpelling: fn("'") === reference("'"), escapesSlash: fn('/') !== '/' };
const nonStringContract = [undefined, null, 0, true, new String('<')].map(value => {
	try { return { type: value instanceof String ? 'boxed-string' : String(value), result: fn(value) }; }
	catch (error) { return { type: value instanceof String ? 'boxed-string' : String(value), error: error.name }; }
});
let checksum = 0;
const measurements = [];
for (const [name, value] of Object.entries(cases)) {
	const inputs = Array.isArray(value) ? value : [value];
	for (const input of inputs) assert.equal(normalize(fn(input)), reference(input));
	const inputUnits = Math.max(...inputs.map(input => input.length));
	const minimumInputUnits = Math.min(...inputs.map(input => input.length));
	const outputUnits = Math.max(...inputs.map(input => fn(input).length));
	const batch = Math.max(1, Math.min(256, Math.ceil(65536 / inputUnits)));
	let cursor = 0;
	const consume = inputs.length === 1
		? () => { for (let i = 0; i < batch; i++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0; }
		: () => {
			for (let i = 0; i < batch; i++) {
				checksum = (checksum + Buffer.byteLength(fn(inputs[cursor]))) >>> 0;
				if (++cursor === inputs.length) cursor = 0;
			}
		};
	const warm = performance.now();
	let warmIterations = 0;
	const minimumWarmup = inputUnits < 256 ? 10000 : 1000;
	do { consume(); warmIterations += batch; } while (performance.now() - warm < 100 || warmIterations < minimumWarmup);
	global.gc?.();
	let iterations = 0;
	const start = performance.now();
	do { consume(); iterations += batch; } while (performance.now() - start < 300);
	measurements.push({ name, inputUnits, minimumInputUnits, inputPoolSize: inputs.length, outputUnits,
		nsPerCall: (performance.now() - start) * 1e6 / iterations, warmIterations, iterations });
}

console.log(JSON.stringify({ variant, compatibility, nonStringContract, measurements, checksum }));
