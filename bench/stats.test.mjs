import assert from 'node:assert/strict';
import { test } from 'node:test';
import { median, pairedChanges } from './stats.mjs';

test('paired comparison retains each process baseline when host speed varies', () => {
	const runs = [[70, 69], [75, 80], [84, 86]].map(([esm, native]) => ({ medians: { esm, native } }));
	// Two processes are within 5%; dividing independent medians spuriously
	// selects the middle process's 6.67% regression for the entire experiment.
	assert(median(pairedChanges(runs, 'native')) < 5);
	assert(Math.abs(median(pairedChanges(runs, 'native')) - (86 / 84 - 1) * 100) < 1e-12);
	assert.deepEqual(pairedChanges(runs, 'esm'), [0, 0, 0]);
	assert.equal(median([1, 2, 3, 4]), 2.5);
});

test('paired comparison detects a regression even with different absolute process times', () => {
	const runs = [[100, 110], [1, 1.1], [10, 11]].map(([esm, native]) => ({ medians: { esm, native } }));
	assert(Math.abs(median(pairedChanges(runs, 'native')) - 10) < 1e-12);
	assert.throws(() => median([]), /empty sample/);
});
