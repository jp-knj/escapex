import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

async function load(path) {
	const report = JSON.parse(await readFile(path, 'utf8'));
	const entries = new Map();
	const hash = createHash('sha256');
	for (const [file, result] of Object.entries(report.files).sort(([a], [b]) => a.localeCompare(b))) {
		hash.update(JSON.stringify([file, result.source]));
		for (const mutant of result.mutants) {
			const key = JSON.stringify([file, mutant.mutatorName, mutant.location, mutant.replacement]);
			assert(!entries.has(key), `Duplicate mutant: ${key}`);
			assert.notEqual(mutant.status, 'Pending', 'The mutation run must finish first');
			entries.set(key, { file, ...mutant });
		}
	}
	assert(entries.size > 0, 'No mutations were reported');
	const counts = {};
	for (const mutant of entries.values()) counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;
	const killed = counts.Killed ?? 0;
	const timedOut = counts.Timeout ?? 0;
	const valid = killed + timedOut + (counts.Survived ?? 0) + (counts.NoCoverage ?? 0);
	assert(valid > 0, 'No valid mutants were tested');
	return {
		entries,
		summary: {
			path, sourceSha256: hash.digest('hex'), total: entries.size, counts,
			// Stryker counts timeouts as detected; expose both figures explicitly.
			scorePercent: 100 * (killed + timedOut) / valid,
			killedExcludingTimeoutPercent: 100 * killed / valid,
		},
	};
}

const current = await load(process.argv[2] ?? 'target/mutation/mutation.json');
const describe = (mutant) => ({
	file: mutant.file, id: mutant.id, line: mutant.location.start.line,
	operator: mutant.mutatorName, replacement: mutant.replacement, status: mutant.status,
});
const output = {
	current: current.summary,
	survivors: [...current.entries.values()].filter((mutant) => mutant.status === 'Survived').map(describe),
};
if (process.argv[3]) {
	const previous = await load(process.argv[3]);
	assert.equal(current.summary.sourceSha256, previous.summary.sourceSha256, 'Production source differs');
	assert.deepEqual([...current.entries.keys()].sort(), [...previous.entries.keys()].sort(), 'Mutant sets differ');
	output.previous = previous.summary;
	output.changed = [...current.entries].filter(([key, mutant]) => mutant.status !== previous.entries.get(key).status)
		.map(([key, mutant]) => ({ ...describe(mutant), previousStatus: previous.entries.get(key).status }));
}
console.log(JSON.stringify(output, null, 2));
