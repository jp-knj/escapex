import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

function fixture(t) {
	const directory = mkdtempSync(join(tmpdir(), 'escapex-mutation-summary-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	return {
		write(name, statuses, source = 'original source') {
			const path = join(directory, `${name}.json`);
			writeFileSync(path, JSON.stringify({ files: { 'src/escape.ts': {
				source, mutants: statuses.map((status, index) => ({
					id: String(index), status, mutatorName: 'ConditionalExpression', replacement: 'true',
					location: { start: { line: index + 1, column: 0 }, end: { line: index + 1, column: 1 } },
				})),
			} } }));
			return path;
		},
		run(...paths) {
			return spawnSync(process.execPath, [fileURLToPath(new URL('./summarize.mjs', import.meta.url)), ...paths], { encoding: 'utf8' });
		},
	};
}

test('separates timeouts from killed mutants and excludes invalid mutants from the denominator', (t) => {
	const f = fixture(t);
	const result = f.run(f.write('current', ['Killed', 'Killed', 'Timeout', 'Survived', 'NoCoverage', 'CompileError', 'RuntimeError']));
	assert.equal(result.status, 0, result.stderr);
	const report = JSON.parse(result.stdout);
	assert.equal(report.current.total, 7);
	assert.equal(report.current.scorePercent, 60);
	assert.equal(report.current.killedExcludingTimeoutPercent, 40);
	assert.deepEqual(report.survivors.map(({ id }) => id), ['3']);
});

test('compares individual faults instead of only comparing scores', (t) => {
	const f = fixture(t);
	const result = f.run(f.write('current', ['Killed', 'Timeout']), f.write('previous', ['Survived', 'Killed']));
	assert.equal(result.status, 0, result.stderr);
	const report = JSON.parse(result.stdout);
	assert.deepEqual(report.changed.map(({ previousStatus, status }) => [previousStatus, status]), [
		['Survived', 'Killed'], ['Killed', 'Timeout'],
	]);
});

test('rejects comparisons with changed source or changed mutant sets', (t) => {
	const f = fixture(t);
	const current = f.write('current', ['Killed']);
	for (const [previous, message] of [
		[f.write('source', ['Killed'], 'changed source'), /Production source differs/],
		[f.write('mutants', ['Killed', 'Killed']), /Mutant sets differ/],
	]) {
		const result = f.run(current, previous);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, message);
	}
});

test('rejects unfinished, empty, or wholly invalid reports', (t) => {
	const f = fixture(t);
	for (const [name, statuses, message] of [
		['pending', ['Pending'], /must finish first/],
		['empty', [], /No mutations/],
		['invalid', ['CompileError'], /No valid mutants/],
	]) {
		const result = f.run(f.write(name, statuses));
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, message);
	}
});
