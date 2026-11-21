// Rebuild the current-workspace report from raw measurements; never rerun timers.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { median } from '../stats.mjs';

assert.equal(process.argv.length, 3, 'Usage: node bench/competitors/report.mjs RESULTS_DIRECTORY');
const directory = resolve(process.argv[2]);
const load = async file => JSON.parse(await readFile(join(directory, file), 'utf8'));
const apis = await Promise.all(['escapeHTML', 'escapeText', 'escapeAttribute'].map(async operation => {
	const result = await load(`${operation}.json`);
	assert.equal(result.operation, operation);
	assert(result.variants.includes('esm'));
	assert(result.rounds >= 3);
	assert.equal(result.runs.length, result.rounds * result.variants.length);
	for (const variant of result.variants) {
		const runs = result.runs.filter(run => run.variant === variant);
		assert.equal(new Set(runs.map(run => run.round)).size, result.rounds);
		for (const row of result.summary) {
			const samples = runs.map(run => run.measurements.find(measurement => measurement.name === row.name).nsPerCall);
			assert(samples.every(value => Number.isFinite(value) && value > 0));
			assert.equal(row.nsPerCall[variant], median(samples));
			assert.deepEqual(row.ranges[variant], { min: Math.min(...samples), max: Math.max(...samples) });
		}
	}
	return result;
}));
const replay = await load('replay.json');
const environment = apis[0].environment;
const hashes = {};
for (const result of [...apis, replay]) {
	const env = result.environment ?? result;
	for (const name of ['node', 'platform', 'arch', 'cpu']) assert.equal(env[name], environment[name]);
	for (const [file, hash] of Object.entries(result.sha256 ?? result.sourceHashes)) {
		if (hashes[file]) assert.equal(hash, hashes[file], `Source differs between measurements: ${file}`);
		hashes[file] = hash;
	}
}
const lines = ['# Current workspace API comparison', '',
	`${environment.cpu}; ${environment.platform} ${environment.arch}; Node ${environment.node}; V8 ${environment.v8}.`, '',
	`Measured from ${apis[0].startedAt} through ${replay.completedAt}.`, '',
	'The default ESM entry is included in every comparison. These measurements describe this local workspace and host; they are not a cross-platform result or a complete Astro build speedup. Source and built-artifact SHA-256 hashes in the JSON identify the measured code. No release or source commit is inferred from the package version.', '',
	'Fresh processes, rotated implementation order, at least 100 ms warmup and 10,000 short calls or 1,000 long calls, then at least 300 ms per case. Every measured call includes Buffer.byteLength of the result. Imports and Wasm initialization are excluded. Values below are medians of process means, with minimum and maximum in parentheses; ranges are not confidence intervals.', '',
	'## HTML escaping and competitors', '',
	`Installed competitor versions: ${Object.entries(apis[0].versions).map(([name, version]) => `${name} ${version}`).join(', ')}.`, '',
	'The HTML suite retains the historical 25 inputs. Text and attribute suites add quotes-only, CR/LF, and mixed context inputs across the 16/128/256-unit boundaries. They compare the three escapex entries using the same operation. Competitors without these context APIs are excluded rather than measured with different output rules.', ''];
for (const result of apis) {
	lines.push(`## ${result.operation}`, '',
		`${result.rounds} fresh processes per implementation. Raw data: [${result.operation}.json](./${result.operation}.json).`, '',
		`| Case | UTF-16 units (min to max) | Pool | ${result.variants.join(' | ')} |`,
		`|---|---:|---:|${result.variants.map(() => '---:').join('|')}|`);
	for (const row of result.summary) lines.push(`| ${row.name} | ${row.minimumInputUnits} to ${row.inputUnits} | ${row.inputPoolSize} | ${result.variants.map(variant => {
		const range = row.ranges[variant];
		return `${row.nsPerCall[variant].toFixed(1)} (${range.min.toFixed(1)} to ${range.max.toFixed(1)})`;
	}).join(' | ')} |`);
	lines.push('', 'Times are nanoseconds per call.', '');
}
lines.push('## Replay of actual Astro escape inputs', '',
	`${replay.rounds} fresh processes per implementation and corpus, with rotated order, at least 100 ms warmup and 300 ms measurement. Values include Buffer.byteLength and are milliseconds per complete corpus, excluding imports.`, '',
	replay.reusedInputs ? 'Previously captured inputs were reused and checked against the expected input profiles.' : 'Inputs were captured from fresh standard ESM Astro builds. Complete output hashes were checked against escape-html builds, and call distributions were checked against the stored profiles.', '',
	'This replays only Astro escapeHTML calls. It excludes compilation, file writes, other Astro functions and startup, so it cannot establish full-build savings.', '',
	'| Corpus | Calls | Implementation | Median ms | Min ms | Max ms |', '|---|---:|---|---:|---:|---:|');
for (const row of replay.summary) {
	const runs = replay.runs.filter(run => run.scenario === row.scenario && run.variant === row.variant);
	assert.equal(runs.length, replay.rounds);
	assert.equal(new Set(runs.map(run => run.round)).size, replay.rounds);
	const samples = runs.map(run => run.msPerCorpus);
	assert(samples.every(value => Number.isFinite(value) && value > 0));
	assert.equal(row.medianMs, median(samples));
	assert.equal(row.minMs, Math.min(...samples));
	assert.equal(row.maxMs, Math.max(...samples));
	const input = replay.inputs.find(input => input.scenario === row.scenario);
	assert(runs.every(run => run.callsPerCorpus === input.profile.calls));
	lines.push(`| ${row.scenario} | ${input.profile.calls} | ${row.variant} | ${row.medianMs.toFixed(3)} | ${row.minMs.toFixed(3)} | ${row.maxMs.toFixed(3)} |`);
}
lines.push('', 'Raw replay samples, input hashes, output hashes and profiles: [replay.json](./replay.json).', '',
	'Reproduction commands and protocol: [benchmark guide](../../README.md#current-workspace-comparison).', '');
await writeFile(join(directory, 'README.md'), lines.join('\n'));
