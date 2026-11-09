import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, arch, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { variants } from './implementations.mjs';
import { median, pairedChanges } from './stats.mjs';

const kind = process.argv[2] ?? 'micro';
if (!['micro', 'astro', 'astro-paired'].includes(kind)) throw new Error('Expected micro, astro or astro-paired');
const isAstro = kind.startsWith('astro');
const paired = kind === 'astro-paired';
const rounds = Number(process.env.BENCH_ROUNDS ?? (paired ? 9 : 3));
assert(Number.isInteger(rounds) && rounds >= 3, 'At least three independent runs are required');
const runs = [];
const scenarios = isAstro ? ['large-props', 'official-portfolio-hero', 'official-with-vitest'] : ['all'];
for (let round = 0; round < rounds; round++) {
	// Rotate ordering to reduce a fixed warm-machine/order advantage.
	const order = [...variants.slice(round % variants.length), ...variants.slice(0, round % variants.length)];
	for (const scenario of scenarios) {
		if (paired) {
			process.stderr.write(`${kind} ${round + 1}/${rounds} ${scenario}\n`);
			const output = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(new URL('./astro/paired.mjs', import.meta.url)), scenario, String(round)], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
			runs.push({ ...JSON.parse(output.trim()), round: round + 1 });
			continue;
		}
		for (const variant of order) {
			process.stderr.write(`${kind} ${round + 1}/${rounds} ${scenario} ${variant}\n`);
			const worker = new URL(kind === 'astro' ? './astro/worker.mjs' : './micro.mjs', import.meta.url);
			const output = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(worker), variant, scenario], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
			runs.push({ round: round + 1, scenario, ...JSON.parse(output.trim()) });
		}
	}
}
if (isAstro) {
	for (const scenario of scenarios) {
		const hashes = new Set(runs.filter((run) => run.scenario === scenario).map((run) => run.htmlSha256));
		assert.equal(hashes.size, 1, `HTML must match across all implementations: ${scenario}`);
	}
}
const summary = [];
for (const scenario of scenarios) {
	const selected = runs.filter((run) => run.scenario === scenario);
	const keys = isAstro ? ['render'] : selected[0].measurements.map(({ name, operation }) => `${name}/${operation}`);
	for (const key of keys) {
		const medians = Object.fromEntries(variants.map((variant) => [variant, median(selected.filter((run) => paired || run.variant === variant).map((run) => paired ? run.medians[variant] : isAstro
			? run.msPerRender : run.measurements.find((measurement) => `${measurement.name}/${measurement.operation}` === key).nsPerCall))]));
		const changes = paired ? pairedChanges(selected, 'native') : undefined;
		const nativeChangePercent = changes ? median(changes) : (medians.native / medians.esm - 1) * 100;
		summary.push({ scenario, key, unit: isAstro ? 'ms/render' : 'ns/call', medians, nativeChangePercent,
			...(changes ? { pairedChangesPercent: changes } : {}),
			...(isAstro ? { thresholdPercent: scenario === 'large-props' ? -5 : 5,
				pass: nativeChangePercent <= (scenario === 'large-props' ? -5 : 5) } : {}) });
	}
}
const result = { date: new Date().toISOString(), environment: { node: process.version, platform: platform(), arch: arch(), os: release(), cpu: cpus()[0]?.model },
	...(process.env.GITHUB_ACTIONS === 'true' ? { ci: { commit: process.env.GITHUB_SHA, target: process.env.NATIVE_PLATFORM,
		runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } } : {}),
	...(isAstro ? { astro: JSON.parse(await readFile(new URL('./astro/node_modules/astro/package.json', import.meta.url))).version, containerLifetime: 'one-render-included-in-timing' } : {}),
	...(paired ? { protocol: 'paired-williams-8x500ms-v2', aggregation: 'median-of-within-process-ratios', warmupMsPerVariant: 1000, blockMs: 500, cyclesPerProcess: 8 } : {}),
	kind, rounds, summary, runs };
const dir = new URL('../target/bench-results/', import.meta.url);
await mkdir(dir, { recursive: true });
const output = new URL(`${kind}-${platform()}-${arch()}-node${process.versions.node.split('.')[0]}.json`, dir);
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.table(summary.map(({ scenario, key, medians, nativeChangePercent, pass }) => ({ scenario, key, ...medians,
	'native change %': nativeChangePercent.toFixed(2), ...(pass === undefined ? {} : { pass }) })));
console.log(fileURLToPath(output));
if (paired) assert(summary.every(({ pass }) => pass), 'Paired Astro performance thresholds not met; see the saved JSON');
