import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { median, pairedChanges } from '../stats.mjs';

const rounds = Number(process.env.BENCH_ROUNDS ?? 3);
assert(Number.isInteger(rounds) && rounds >= 3);
const scenarios = ['large-props', 'official-portfolio-hero', 'official-with-vitest'];
const variants = ['before', 'esm', 'wasm', 'native'];
const runs = [];
for (let round = 0; round < rounds; round++) {
	for (const scenario of scenarios) {
		process.stderr.write(`Astro search ${round + 1}/${rounds} ${scenario}\n`);
		const output = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(new URL('./search-paired.mjs', import.meta.url)), scenario, String(round)], { encoding: 'utf8' });
		runs.push(JSON.parse(output.trim()));
	}
}
const summary = scenarios.map(scenario => {
	const selected = runs.filter(run => run.scenario === scenario);
	assert.equal(new Set(selected.map(run => run.htmlSha256)).size, 1);
	const changes = pairedChanges(selected, 'esm', 'before');
	return { scenario, medians: Object.fromEntries(variants.map(variant => [variant, median(selected.map(run => run.medians[variant]))])),
		esmChangesPercent: changes, esmChangePercent: median(changes) };
});
const result = { kind: 'astro-search', date: new Date().toISOString(), rounds, baselineCommit: '7ba356c34abb59b6e977e9ba574fde4123d0ed94',
	environment: { node: process.version, platform: process.platform, arch: process.arch, os: release(), cpu: cpus()[0]?.model },
	astro: JSON.parse(await readFile(new URL('./node_modules/astro/package.json', import.meta.url))).version,
	protocol: 'paired-williams-8x500ms-v2', aggregation: 'median-of-within-process-ratios', containerLifetime: 'one-render-included-in-timing',
	summary, runs };
const dir = new URL('../../target/bench-results/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL(`astro-search-${process.platform}-${process.arch}-node${process.versions.node.split('.')[0]}.json`, dir);
await writeFile(file, JSON.stringify(result, null, 2) + '\n');
console.table(summary.map(({ scenario, medians, esmChangePercent }) => ({ scenario, ...medians, 'ESM change %': esmChangePercent.toFixed(2) })));
console.log(fileURLToPath(file));
