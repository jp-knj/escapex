import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { options, reference } from './suite.mjs';
import { cases, casesFor } from './cases.mjs';
import * as js from '../../dist/index.mjs';

test('context benchmarks reject competitors with different escaping contracts before timing', () => {
	assert.equal(options({}).operation, 'escapeHTML');
	assert.deepEqual(options({ BENCH_OPERATION: 'escapeText' }).variants, ['esm', 'wasm', 'native']);
	for (const env of [
		{ BENCH_OPERATION: 'unescapeHTML' },
		{ BENCH_OPERATION: 'escapeText', BENCH_VARIANTS: 'esm,html-escaper' },
		{ BENCH_OPERATION: 'escapeAttribute', BENCH_VARIANTS: 'escape-html' },
		{ BENCH_VARIANTS: 'esm,esm' },
		{ BENCH_ROUNDS: '2' }, { BENCH_ROUNDS: '3.5' },
	]) assert.throws(() => options(env));
	const invalid = spawnSync(process.execPath, [fileURLToPath(new URL('./worker.mjs', import.meta.url)), 'escape-html', 'escapeText'], { encoding: 'utf8' });
	assert.notEqual(invalid.status, 0);
	assert.match(invalid.stderr, /does not expose escapeText/);
});

test('benchmark oracle distinguishes quotes, CR/LF and malformed UTF-16 across APIs', () => {
	const input = '\ud800\'"\r\n<&>\0\udfff';
	assert.equal(reference('escapeHTML', input), '\ud800&#39;&quot;\r\n&lt;&amp;&gt;\0\udfff');
	assert.equal(reference('escapeText', input), '\ud800\'"\r\n&lt;&amp;&gt;\0\udfff');
	assert.equal(reference('escapeAttribute', input), '\ud800&#39;&quot;&#13;&#10;&lt;&amp;&gt;\0\udfff');
	assert.equal(Object.keys(cases).length, 25, 'Historical HTML corpus must remain comparable');
	assert.deepEqual(casesFor('escapeAttribute')['mixed-context'].map(value => value.length),
		[15, 16, 17, 127, 128, 129, 255, 256, 257].flatMap(length => [length, length, length]));
	for (const operation of ['escapeHTML', 'escapeText', 'escapeAttribute']) {
		for (const value of Object.values(casesFor(operation))) {
			for (const input of Array.isArray(value) ? value : [value]) assert.equal(js[operation](input), reference(operation, input));
		}
	}
});
