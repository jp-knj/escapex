import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const [variant, file] = process.argv.slice(2);
const requireCompetitor = createRequire(new URL('../competitors/package.json', import.meta.url));
const inputs = JSON.parse(readFileSync(file));
let fn;
if (variant === 'native') fn = (await import('../../dist/native.mjs')).escapeHTML;
else if (variant === 'candidate') fn = (await import(pathToFileURL(process.env.COST_NATIVE_API))).escapeHTML;
else if (variant === 'before') fn = (await import('../../target/ssg-tuning/before-api/native.mjs')).escapeHTML;
else if (variant === 'wasm') {
	const api = await import('../../dist/wasm.mjs');
	await api.init(readFileSync(new URL('../../dist/escape_html.wasm', import.meta.url)));
	fn = api.escapeHTML;
} else if (variant === 'escape-html') fn = requireCompetitor(variant);
else if (variant === 'fast-escape-html') fn = requireCompetitor(variant).escapeHTML;
else if (variant === 'html-escaper') fn = requireCompetitor(variant).escape;
else throw new Error(`Unknown variant ${variant}`);
const reference = requireCompetitor('escape-html');
for (const input of inputs) assert.equal(fn(input), reference(input));
let checksum = 0;
const run = () => { for (const input of inputs) checksum = (checksum + Buffer.byteLength(fn(input))) >>> 0; };
let start = performance.now();
let warmup = 0;
do { run(); warmup++; } while (performance.now() - start < 100);
global.gc?.();
start = performance.now();
let iterations = 0;
do { run(); iterations++; } while (performance.now() - start < 300);
console.log(JSON.stringify({ variant, callsPerCorpus: inputs.length, warmup, iterations,
	msPerCorpus: (performance.now() - start) / iterations, checksum }));
