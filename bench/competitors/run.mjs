import { execFileSync } from 'node:child_process';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { median } from '../stats.mjs';

const availableVariants = ['esm', 'wasm', 'native', 'escape-html', 'fast-escape-html', 'html-escaper', '@napi-rs/escape'];
const variants = process.env.BENCH_VARIANTS?.split(',') ?? availableVariants;
assert(variants.length > 0 && new Set(variants).size === variants.length && variants.every(value => availableVariants.includes(value)), 'Unknown or repeated BENCH_VARIANTS entry');
const rounds = Number(process.env.BENCH_ROUNDS ?? variants.length);
assert(Number.isInteger(rounds) && rounds >= 3, 'BENCH_ROUNDS must be an integer >= 3');
const runs = [];
for (let round = 0; round < rounds; round++) {
	for (let offset = 0; offset < variants.length; offset++) {
		const variant = variants[(round + offset) % variants.length];
		process.stderr.write(`competitors ${round + 1}/${rounds} ${variant}\n`);
		const result = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(new URL('./worker.mjs', import.meta.url)), variant], { encoding: 'utf8' });
		runs.push({ round: round + 1, ...JSON.parse(result) });
	}
}
const summary = runs[0].measurements.map(({ name, inputUnits, minimumInputUnits, inputPoolSize }) => {
	const samples = Object.fromEntries(variants.map(variant => [variant,
		runs.filter(run => run.variant === variant).map(run => run.measurements.find(row => row.name === name).nsPerCall)]));
	return { name, inputUnits, minimumInputUnits, inputPoolSize, nsPerCall: Object.fromEntries(variants.map(variant => [variant, median(samples[variant])])),
		ranges: Object.fromEntries(variants.map(variant => [variant, { min: Math.min(...samples[variant]), max: Math.max(...samples[variant]) }])) };
});
const versions = JSON.parse(await readFile(new URL('./package.json', import.meta.url))).dependencies;
const artifactFiles = ['dist/index.mjs', 'dist/escape-core.mjs', 'dist/native.mjs', 'dist/wasm.mjs', 'dist/escape_html.wasm',
	'bench/competitors/run.mjs', 'bench/competitors/worker.mjs', 'bench/competitors/cases.mjs', 'bench/competitors/package-lock.json'];
const sha256 = Object.fromEntries(await Promise.all(artifactFiles.map(async path => [path,
	createHash('sha256').update(await readFile(new URL('../../' + path, import.meta.url))).digest('hex')])));
const result = { kind: 'competitors', date: new Date().toISOString(), environment: { node: process.version, platform: process.platform,
	arch: process.arch, os: release(), cpu: cpus()[0]?.model }, rounds, versions,
	...(process.env.GITHUB_ACTIONS === 'true' ? { ci: { commit: process.env.GITHUB_SHA, target: process.env.NATIVE_PLATFORM, runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } } : {}),
	...(process.env.BENCH_SOURCE_COMMIT ? { sourceCommit: process.env.BENCH_SOURCE_COMMIT } : {}), sha256,
	method: 'Fresh process per variant/round; rotated order (every position once per complete cycle of implementations); at least 100ms warmup and 10000 short calls or 1000 long calls; 300ms measurement; Buffer.byteLength consumes output; synchronous string-to-string API, initialization excluded; inputUnits is the maximum pool length; mixed cases rotate through the recorded input pools. Median and min/max of process means, not a confidence interval.',
	summary, runs };
const dir = new URL('../../target/bench-results/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL(`competitors-${process.platform}-${process.arch}-node${process.versions.node.split('.')[0]}.json`, dir), JSON.stringify(result, null, 2) + '\n');
console.table(summary.map(({ name, nsPerCall }) => ({ name, ...Object.fromEntries(Object.entries(nsPerCall).map(([k, v]) => [k, v.toFixed(1)])) })));
