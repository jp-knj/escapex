// Run from the repository root. Compare the saved pre-cleanup APIs with dist.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const output = 'target/cleanup-20261111/paired.json';
const files = ['target/cleanup-20261111/before-api/index.mjs', 'dist/index.mjs', 'target/cleanup-20261111/before-api/native.mjs', 'dist/native.mjs'];
const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2;
};
if (process.argv[2] !== 'worker') {
	const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
	const sources = ['src/escape-html.ts', 'src/native.ts', 'src/unescape-html.ts', 'src/wasm.ts', 'rust/src/native_escape.rs'];
	const modules = [...files, 'target/cleanup-20261111/before-api/escape-core.mjs', 'dist/escape-core.mjs'];
	const script = fileURLToPath(import.meta.url);
	const result = { protocol: 'Three fresh processes; both versions loaded in each. Each block consumes output with Buffer.byteLength. Warmup: at least 100 ms and 5,000 short calls or 100 long calls per API/case. Eight 25 ms blocks per API in balanced Williams order. Per-process median block times and before/after ratios are retained.',
		startedAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model,
		baseline: JSON.parse(readFileSync('target/cleanup-20261111/before-api/source.json', 'utf8')),
		implementationHashes: Object.fromEntries(sources.map(file => [file, hash(file)])),
		moduleHashes: Object.fromEntries(modules.map(file => [file, hash(file)])),
		protocolHashes: { script: hash(script), cases: hash('bench/competitors/cases.mjs') }, runs: [] };
	for (let round = 0; round < 3; round++) {
		console.log(`paired ${round + 1}/3`);
		result.runs.push(JSON.parse(execFileSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), 'worker', String(round)], { encoding: 'utf8' })));
	}
	result.summary = result.runs[0].measurements.map(({ name, operation, entry }) => {
		const rows = result.runs.map(run => run.measurements.find(row => row.name === name && row.operation === operation && row.entry === entry));
		return { name, operation, entry, beforeNs: median(rows.map(row => row.beforeNs)), afterNs: median(rows.map(row => row.afterNs)), changePercent: median(rows.map(row => row.changePercent)) };
	});
	result.completedAt = new Date().toISOString();
	writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
} else {
	const round = Number(process.argv[3]);
	const apis = await Promise.all(files.map(file => import(pathToFileURL(resolve(file)))));
	const { cases } = await import(pathToFileURL(resolve('bench/competitors/cases.mjs')));
	const inputs = { short: cases.short, unchanged: cases['unchanged-short'], 'quoted-json': cases['quoted-json'], 'attribute-newlines': '\r\n&<\'"日本語😀\ud800'.repeat(2) };
	const order = [[0, 1, 3, 2], [1, 2, 0, 3], [2, 3, 1, 0], [3, 0, 2, 1]];
	const measurements = [];
	let checksum = 0;
	for (const [name, input] of Object.entries(inputs)) {
		for (const operation of ['escapeHTML', 'escapeText', 'escapeAttribute', 'unescapeHTML']) {
			const value = operation === 'unescapeHTML' ? apis[0].escapeHTML(input) : input;
			const functions = apis.map(api => api[operation]);
			for (const fn of functions) assert.equal(fn(value), functions[0](value));
			const batch = Math.max(1, Math.min(256, Math.ceil(65536 / value.length)));
			const measure = (fn, milliseconds, minimum = 0) => {
				let calls = 0;
				const start = performance.now();
				do {
					for (let i = 0; i < batch; i++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0;
					calls += batch;
				} while (performance.now() - start < milliseconds || calls < minimum);
				return (performance.now() - start) * 1e6 / calls;
			};
			for (const index of order[round % 4]) measure(functions[index], 100, value.length < 256 ? 5000 : 100);
			global.gc?.();
			const blocks = Array.from({ length: 4 }, () => []);
			for (let cycle = 0; cycle < 8; cycle++) {
				for (const index of order[(cycle + round) % 4]) blocks[index].push(measure(functions[index], 25));
			}
			for (const [entry, start] of [['esm', 0], ['native', 2]]) {
				const beforeNs = median(blocks[start]), afterNs = median(blocks[start + 1]);
				measurements.push({ name, operation, entry, beforeNs, afterNs, changePercent: 100 * (afterNs / beforeNs - 1), beforeBlocks: blocks[start], afterBlocks: blocks[start + 1] });
			}
		}
	}
	console.log(JSON.stringify({ round, node: process.version, measurements, checksum }));
}
