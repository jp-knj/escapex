import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { median } from '../stats.mjs';
import { targets } from '../../scripts/native-targets.mjs';
import { cases, expansionCases } from './cases.mjs';

// Recompute acceptance from all process samples, rather than trusting summary flags.
const directory = resolve(process.argv[2] ?? 'bench/results/native-selection-20261112');
const reports = [];
for (const file of await readdir(directory)) {
	if (!file.endsWith('.json')) continue;
	const report = JSON.parse(await readFile(join(directory, file), 'utf8'));
	if (report.runs && report.final && report.environment) reports.push({ file, report });
}
const ciReports = reports.filter(({ report }) => report.environment.target);
assert.deepEqual(ciReports.map(({ report }) => report.environment.target).sort(), targets.map(target => target.id).sort(), 'Need exactly eight platform results');
const summary = [];
for (const { file, report } of reports) {
	assert.equal(report.environment.node.split('.')[0], 'v24');
	assert(report.completedAt);
	// Git checkout line endings can differ on Windows; require the same commit
	// and byte-identical built APIs while retaining every original source hash.
	if (report.environment.target) assert.equal(report.commit, ciReports[0].report.commit, 'All CI environments must use the same source commit');
	else assert(ciReports.some(({ report: ci }) => JSON.stringify(ci.hashes) === JSON.stringify(report.hashes)), 'Local sources and protocol must match a CI checkout');
	assert.equal(report.manifest.baselineCommit, reports[0].report.manifest.baselineCommit);
	for (const variant of ['before', 'tail', 'expanded', 'combined']) {
		assert.equal(report.manifest.variants[variant].api, reports[0].report.manifest.variants[variant].api, 'All environments must measure identical API bundles');
	}
	for (const run of report.runs) {
		assert.deepEqual(run.measurements.map(row => row.name), Object.keys(cases));
		for (const row of run.measurements) {
			assert(row.warmIterations >= (row.inputUnits < 256 ? 10000 : 1000));
			assert(row.nsPerCall * row.iterations >= 300e6, 'Each measurement must last at least 300ms');
		}
	}
	const candidates = {};
	for (const variant of ['tail', 'expanded', 'combined']) {
		function compare(rounds) {
			return Object.keys(cases).map(name => {
				const samples = key => report.runs.filter(run => run.variant === key && run.round < rounds)
					.map(run => run.measurements.find(row => row.name === name).nsPerCall);
				const before = samples('before'), after = samples(variant);
				assert.equal(before.length, rounds);
				assert.equal(after.length, rounds);
				return { name, change: median(after) / median(before) - 1 };
			});
		}
		const rounds = compare(5).some(row => row.change > 0.05) ? 10 : 5;
		const rows = compare(rounds);
		const regressions = rows.filter(row => row.change > 0.05);
		const expansionChange = Math.exp(expansionCases.reduce((sum, name) => sum + Math.log(1 + rows.find(row => row.name === name).change), 0) / 4) - 1;
		const passes = regressions.length === 0 && (variant === 'tail' || expansionChange <= -0.05);
		assert.equal(report.final[variant].rounds, rounds);
		assert.deepEqual(report.final[variant].regressions, regressions.map(row => row.name));
		assert.equal(report.final[variant].passes, passes);
		assert(Math.abs(report.final[variant].expansionChange - expansionChange) < 1e-12);
		candidates[variant] = { rounds, regressions, expansionChange, passes,
			terminalChange: rows.find(row => row.name === 'cluster-tail-8').change };
	}
	summary.push({ target: report.environment.target ?? `local-${report.environment.platform}-${report.environment.arch}`, file, candidates });
}
summary.sort((a, b) => a.target.localeCompare(b.target));
const selection = summary.every(row => row.candidates.combined.passes && row.candidates.expanded.passes) ? 'combined'
	: summary.every(row => row.candidates.tail.passes) ? 'tail' : 'before';
await writeFile(join(directory, 'decision.json'), JSON.stringify({ selection, summary }, null, 2) + '\n');
const percent = value => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const lines = ['# Native selection evaluation', '', `Decision: **${selection}**.`, '',
	'All 64 cases use five fresh Node 24 processes per candidate and baseline. Any candidate with an initial regression above 5% receives five more processes with a matching baseline. The table uses each candidate\'s final five- or ten-process medians. Negative changes mean less time.', '',
	'| Platform | Tail: terminal case | Tail: cases >+5% | Sampling: four-case geometric mean | Sampling: cases >+5% | Combined: four-case geometric mean | Combined: cases >+5% |',
	'|---|---:|---:|---:|---:|---:|---:|'];
for (const { target, file, candidates: c } of summary) lines.push(`| [${target}](${file}) | ${percent(c.tail.terminalChange)} | ${c.tail.regressions.length} | ${percent(c.expanded.expansionChange)} | ${c.expanded.regressions.length} | ${percent(c.combined.expansionChange)} | ${c.combined.regressions.length} |`);
lines.push('', '## Regressions after the required repeat', '', 'All values and process samples, including the initial five and additional five, are retained in the linked JSON files. The cases below exceed +5% in the final median comparison.', '');
for (const { target, candidates } of summary) {
	lines.push(`### ${target}`, '');
	for (const [variant, result] of Object.entries(candidates)) lines.push(`- ${variant} (${result.rounds} processes): ${result.regressions.length ? result.regressions.map(row => `${row.name} ${percent(row.change)}`).join('; ') : 'no case above +5%'}.`);
	lines.push('');
}
await writeFile(join(directory, 'comparison.md'), lines.join('\n') + '\n');
console.log(JSON.stringify({ selection, environments: summary.length }, null, 2));
