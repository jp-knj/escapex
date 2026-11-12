import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { targets } from '../../scripts/native-targets.mjs';
import { cases } from '../native-selection/cases.mjs';
import { median } from '../stats.mjs';

const folder = resolve(process.argv[2] ?? 'bench/results/rust-buffers-20261112');
const rows = [];
const evidence = [];
for (const target of [...targets.map(target => target.id), 'local']) {
	const data = JSON.parse(await readFile(resolve(folder, `${target}.json`)));
	assert(data.completedAt, `${target}: incomplete`);
	assert(data.environment.node.startsWith('v24.'));
	if (target !== 'local') assert.equal(data.manifest.target.id, target);
	for (const variant of ['before', 'capacity', 'reuse']) assert.equal(data.manifest.variants[variant].api, data.manifest.variants.before.api);
	for (const run of data.runs) {
		assert.deepEqual(run.measurements.map(row => row.name), Object.keys(cases));
		assert(run.compatibility.preservesLoneSurrogates);
		assert(run.compatibility.identicalEntitySpelling);
		for (const sample of run.measurements) {
			assert(sample.nsPerCall > 0 && Number.isFinite(sample.nsPerCall));
			assert(sample.nsPerCall * sample.iterations >= 300e6);
			assert(sample.warmIterations >= (sample.inputUnits < 256 ? 10000 : 1000));
		}
	}
	for (const variant of ['capacity', 'reuse']) {
		const sample = (name, key, count) => data.runs.filter(run => run.variant === key && run.round < count)
			.map(run => run.measurements.find(row => row.name === name).nsPerCall);
		const changes = count => Object.keys(cases).map(name => {
			const before = sample(name, 'before', count), after = sample(name, variant, count);
			assert.equal(before.length, count); assert.equal(after.length, count);
			return { name, beforeMedian: median(before), afterMedian: median(after), change: median(after) / median(before) - 1 };
		});
		const initial = changes(5);
		const rounds = initial.some(row => row.change > 0.05) ? 10 : 5;
		const final = changes(rounds);
		const regressions = final.filter(row => row.change > 0.05);
		assert.deepEqual(regressions.map(row => row.name), data.final[variant].regressions);
		rows.push({ target, variant, rounds, regressions: regressions.map(row => ({ name: row.name, change: row.change })), rows: final });
	}
	evidence.push({ target, commit: data.commit, processes: data.runs.length, samples: data.runs.reduce((n, run) => n + run.measurements.length, 0), hashes: data.hashes });
}
for (const file of Object.keys(evidence[0].hashes)) {
	for (const entry of evidence) assert.equal(entry.hashes[file], evidence[0].hashes[file], `${entry.target}: ${file}`);
}
const passesRegressionGate = Object.fromEntries(['capacity', 'reuse'].map(variant => [variant,
	rows.filter(row => row.variant === variant).every(row => row.regressions.length === 0)]));
await writeFile(resolve(folder, 'decision.json'), JSON.stringify({ passesRegressionGate, evidence, rows }, null, 2) + '\n');
let md = '# Rust buffer measurements\n\nPositive changes mean more time per call. All percentages compare process medians.\n\n';
md += '| Environment | Candidate | Processes per variant | Cases over +5% | Worst change |\n| --- | --- | ---: | ---: | ---: |\n';
for (const row of rows) md += `| ${row.target} | ${row.variant} | ${row.rounds} | ${row.regressions.length} | ${(100 * Math.max(...row.rows.map(value => value.change))).toFixed(2)}% |\n`;
for (const row of rows) {
	md += `\n## ${row.target}: ${row.variant}\n\n| Case | Before (ns) | After (ns) | Change |\n| --- | ---: | ---: | ---: |\n`;
	for (const value of row.rows) md += `| ${value.name} | ${value.beforeMedian.toFixed(2)} | ${value.afterMedian.toFixed(2)} | ${(value.change * 100).toFixed(2)}% |\n`;
}
await writeFile(resolve(folder, 'comparison.md'), md);
console.log(JSON.stringify({ passesRegressionGate, processes: evidence.reduce((n, x) => n + x.processes, 0), samples: evidence.reduce((n, x) => n + x.samples, 0) }, null, 2));
