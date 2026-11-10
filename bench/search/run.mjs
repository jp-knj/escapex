import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { median } from '../stats.mjs';

const variants = ['before', 'esm', 'native'];
const rounds = Number(process.env.BENCH_ROUNDS ?? 3);
assert(Number.isInteger(rounds) && rounds >= 3);
const runs = [];
for (let round = 0; round < rounds; round++) {
	for (let offset = 0; offset < variants.length; offset++) {
		const variant = variants[(round + offset) % variants.length];
		process.stderr.write(`search ${round + 1}/${rounds} ${variant}\n`);
		const output = execFileSync(process.execPath, ['--expose-gc', fileURLToPath(new URL('./worker.mjs', import.meta.url)), variant], { encoding: 'utf8' });
		runs.push({ round: round + 1, ...JSON.parse(output.trim()) });
	}
}
const summary = runs[0].measurements.map(({ name, inputUnits }) => {
	const medians = Object.fromEntries(variants.map(variant => [variant, median(runs.filter(run => run.variant === variant)
		.map(run => run.measurements.find(row => row.name === name).nsPerCall))]));
	return { name, inputUnits, medians, esmChangePercent: (medians.esm / medians.before - 1) * 100 };
});
const result = { kind: 'search', date: new Date().toISOString(), rounds, baselineCommit: '7ba356c34abb59b6e977e9ba574fde4123d0ed94',
	environment: { node: process.version, platform: process.platform, arch: process.arch, os: release(), cpu: cpus()[0]?.model },
	...(process.env.GITHUB_ACTIONS === 'true' ? { ci: { commit: process.env.GITHUB_SHA, target: process.env.NATIVE_PLATFORM,
		runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } } : {}),
	method: 'Fresh process per variant/round; rotated order; 100ms warmup (at least 10000 short calls or 32 long calls); 200ms measurement; Buffer.byteLength consumes every output; median of independent process means.',
	summary, runs };
const directory = new URL('../../target/bench-results/', import.meta.url);
await mkdir(directory, { recursive: true });
const file = new URL(`search-${process.platform}-${process.arch}-node${process.versions.node.split('.')[0]}.json`, directory);
await writeFile(file, JSON.stringify(result, null, 2) + '\n');
console.table(summary.map(({ name, medians, esmChangePercent }) => ({ name, ...medians, 'ESM change %': esmChangePercent.toFixed(2) })));
console.log(fileURLToPath(file));
