import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as api from '../../dist/native.mjs';
import * as reference from '../../dist/index.mjs';

test('returned strings survive buffer reuse, collection and capacity changes', () => {
	const retained = [];
	const sizes = [256, 8192, 1, 4096, 700000, 255, 128, 16384, 0, 1024];
	for (let round = 0; round < 3; round++) {
		for (const size of sizes) {
			const input = ('&<>\'"\r\n日本語😀\ud800\udfff\0' + round).repeat(Math.ceil(size / 17)).slice(0, size);
			for (const name of ['escapeHTML', 'escapeText', 'escapeAttribute', 'unescape']) {
				const value = name === 'unescape' ? '&amp;'.repeat(Math.ceil(size / 5)).slice(0, size) : input;
				retained.push([api[name](value), reference[name](value)]);
			}
			global.gc?.();
			for (const [actual, expected] of retained) assert.equal(actual, expected);
		}
	}
});
