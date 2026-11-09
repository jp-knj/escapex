// Before/after JS comparison using the same fixed Williams protocol as paired.mjs.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { loadImplementation } from '../implementations.mjs';
import * as before from '../fixtures/escape-before-search.mjs';
const variants = ['before', 'esm', 'wasm', 'native'];
import { selectEscape } from './active-escape.mjs';
import { createRender } from './page.mjs';

const [scenario, roundText] = process.argv.slice(2);
const round = Number(roundText);
const apis = Object.fromEntries(await Promise.all(variants.map(async (variant) => [variant, variant === 'before' ? before : await loadImplementation(variant)])));
const render = await createRender(new URL('./active-escape.mjs', import.meta.url), scenario);
let checksum = 0;
async function measure(variant, duration, minimumIterations = 0) {
	selectEscape(apis[variant].escapeHTML);
	const start = performance.now();
	let iterations = 0;
	do {
		checksum = (checksum + (await render()).length) >>> 0;
		iterations++;
	} while (performance.now() - start < duration || iterations < minimumIterations);
	return { variant, msPerRender: (performance.now() - start) / iterations, iterations };
}

const hashes = new Set();
const warmups = [];
const warmupMinimumIterations = scenario === 'large-props' ? 100 : 10000;
for (let index = 0; index < variants.length; index++) {
	const variant = variants[(index + round) % variants.length];
	selectEscape(apis[variant].escapeHTML);
	hashes.add(createHash('sha256').update(await render()).digest('hex'));
	// A time-only warmup performs fewer calls on slower runners, potentially
	// comparing different JIT tiers. Require the same minimum work everywhere.
	warmups.push(await measure(variant, 1000, warmupMinimumIterations));
}
assert.equal(hashes.size, 1, 'HTML must match before comparing timings');
// Williams design: each variant occurs in each position and follows every
// other variant. Repeat the complete design; never stop when a threshold passes.
const orders = [[0, 1, 3, 2], [1, 2, 0, 3], [2, 3, 1, 0], [3, 0, 2, 1]];
const blocks = [];
for (let cycle = 0; cycle < 8; cycle++) {
	const order = orders[(cycle + round) % orders.length];
	for (const index of order) {
		global.gc?.();
		blocks.push({ cycle, ...await measure(variants[index], 500) });
	}
}
const medians = Object.fromEntries(variants.map((variant) => {
	const values = blocks.filter((block) => block.variant === variant).map((block) => block.msPerRender).sort((a, b) => a - b);
	return [variant, (values[3] + values[4]) / 2];
}));
console.log(JSON.stringify({ scenario, round, medians, blocks, warmups, warmupMinimumIterations, htmlSha256: [...hashes][0], checksum }));
