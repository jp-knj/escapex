import { execFileSync } from 'node:child_process';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { median } from '../stats.mjs';
import { options } from './suite.mjs';

const { operation, variants, rounds } = options();
const startedAt = new Date().toISOString();
const root = fileURLToPath(new URL('../../', import.meta.url));
const artifactFiles = ['package.json', 'package-lock.json', 'tsdown.config.mts',
	'src/index.ts', 'src/escape.ts', 'src/unescape.ts', 'dist/index.mjs', 'dist/escape-core.mjs',
	'bench/implementations.mjs', 'bench/stats.mjs', 'bench/competitors/suite.mjs',
	'bench/competitors/run.mjs', 'bench/competitors/worker.mjs', 'bench/competitors/cases.mjs', 'bench/competitors/package-lock.json'];
if (variants.some(value => value === 'wasm' || value === 'native')) {
	artifactFiles.push('src/rust/Cargo.toml', 'src/rust/Cargo.lock');
	for (const file of await readdir(new URL('../../src/rust/src/', import.meta.url))) {
		if (file.endsWith('.rs')) artifactFiles.push(`src/rust/src/${file}`);
	}
}
if (variants.includes('wasm')) artifactFiles.push('src/wasm.ts', 'dist/wasm.mjs', 'dist/escape_html.wasm', 'scripts/wasm.mjs');
if (variants.includes('native')) {
	artifactFiles.push('src/native.ts', 'src/native-platform.ts', 'dist/native.mjs', 'scripts/native.mjs');
	const binaries = (await readdir(new URL('../../dist/native/', import.meta.url))).filter(file => file.endsWith('.node'));
	assert(binaries.length > 0, 'Build the local native addon before measuring it');
	artifactFiles.push(...binaries.map(file => `dist/native/${file}`));
}
const fingerprints = async () => Object.fromEntries(await Promise.all(artifactFiles.map(async path => [path,
	createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')])));
const sha256 = await fingerprints();
const dependencies = JSON.parse(await readFile(new URL('./package.json', import.meta.url))).dependencies;
const versions = {};
for (const variant of variants.filter(value => Object.hasOwn(dependencies, value))) {
	versions[variant] = JSON.parse(await readFile(new URL(`./node_modules/${variant}/package.json`, import.meta.url))).version;
	assert.equal(versions[variant], dependencies[variant], `Installed version mismatch: ${variant}`);
}
const runs = [];
for (let round = 0; round < rounds; round++) {
	for (let offset = 0; offset < variants.length; offset++) {
		const variant = variants[(round + offset) % variants.length];
		process.stderr.write(`competitors ${operation} ${round + 1}/${rounds} ${variant}\n`);
		const result = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(new URL('./worker.mjs', import.meta.url)), variant, operation], { encoding: 'utf8' });
		runs.push({ round: round + 1, ...JSON.parse(result) });
	}
}
const summary = runs[0].measurements.map(({ name, inputUnits, minimumInputUnits, inputPoolSize }) => {
	const samples = Object.fromEntries(variants.map(variant => [variant,
		runs.filter(run => run.variant === variant).map(run => run.measurements.find(row => row.name === name).nsPerCall)]));
	return { name, operation, inputUnits, minimumInputUnits, inputPoolSize, nsPerCall: Object.fromEntries(variants.map(variant => [variant, median(samples[variant])])),
		ranges: Object.fromEntries(variants.map(variant => [variant, { min: Math.min(...samples[variant]), max: Math.max(...samples[variant]) }])) };
});
assert.deepEqual(await fingerprints(), sha256, 'Measured sources or artifacts changed during the run');
const result = { kind: 'competitors', operation, variants, startedAt, date: new Date().toISOString(), environment: { node: process.version, v8: process.versions.v8, platform: process.platform,
	arch: process.arch, os: release(), cpu: cpus()[0]?.model }, rounds, versions,
	...(process.env.GITHUB_ACTIONS === 'true' ? { ci: { commit: process.env.GITHUB_SHA, target: process.env.NATIVE_PLATFORM, runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } } : {}),
	...(process.env.BENCH_SOURCE_COMMIT ? { sourceCommit: process.env.BENCH_SOURCE_COMMIT } : {}), sha256,
	method: 'Fresh process per variant/round; rotated order (every position once per complete cycle of implementations); at least 100ms warmup and 10000 short calls or 1000 long calls; 300ms measurement; Buffer.byteLength consumes output; synchronous string-to-string API, initialization excluded; inputUnits is the maximum pool length; mixed cases rotate through the recorded input pools. Median and min/max of process means, not a confidence interval.',
	summary, runs };
const suffix = operation === 'escapeHTML' ? '' : `-${operation}`;
const output = resolve(root, process.env.BENCH_OUTPUT ?? `target/bench-results/competitors${suffix}-${process.platform}-${process.arch}-node${process.versions.node.split('.')[0]}.json`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.table(summary.map(({ name, nsPerCall }) => ({ name, ...Object.fromEntries(Object.entries(nsPerCall).map(([k, v]) => [k, v.toFixed(1)])) })));
