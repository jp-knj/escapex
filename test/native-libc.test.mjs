import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectLinuxLibc } from '../src/native-libc.ts';

const unavailable = () => { throw new Error('unavailable'); };
const unknown = { name: 'Error', message: 'Cannot identify Linux libc for escapex/native (expected glibc or musl)' };

test('libc: a glibc report takes precedence and avoids filesystem access', () => {
	let reads = 0;
	assert.equal(detectLinuxLibc(
		() => ({ header: { glibcVersionRuntime: '2.39' }, sharedObjects: ['/lib/ld-musl-x86_64.so.1'] }),
		() => { reads++; return 'musl'; },
	), 'gnu');
	assert.equal(reads, 0);
});

test('libc: ldd identifies musl after a thrown, absent, or incomplete report', () => {
	for (const getReport of [unavailable, ...[undefined, null, {}, { header: {} }, { header: { glibcVersionRuntime: '' } }].map(value => () => value)]) {
		const calls = [];
		assert.equal(detectLinuxLibc(
			() => { calls.push('report'); return getReport(); },
			() => { calls.push('ldd'); return '#!/bin/sh\n# musl libc\n'; },
		), 'musl');
		assert.deepEqual(calls, ['report', 'ldd']);
	}
});

test('libc: either musl shared-object spelling works when ldd fails or is inconclusive', () => {
	for (const path of ['/lib/ld-musl-x86_64.so.1', '/usr/lib/libc.musl-aarch64.so.1']) {
		for (const readLdd of [unavailable, () => '', () => 'unrecognized ldd']) {
			assert.equal(detectLinuxLibc(
				() => ({ header: {}, sharedObjects: ['/lib/libz.so.1', path, '/lib/libssl.so.3'] }), readLdd,
			), 'musl', path);
		}
	}
});

test('libc: unknown environments fail explicitly instead of guessing glibc', () => {
	for (const getReport of [unavailable, ...[undefined, null, {}, { sharedObjects: [] },
		{ header: { glibcVersionRuntime: '' }, sharedObjects: ['/lib/libc.so.6'] }].map(value => () => value)]) {
		for (const readLdd of [unavailable, () => '', () => 'ldd (GNU libc) 2.39']) {
			assert.throws(() => detectLinuxLibc(getReport, readLdd), unknown);
		}
	}
});

test('libc: similar library names do not identify musl', () => {
	for (const path of ['/lib/ld-muscle.so', '/lib/libc.muscle.so', '/lib/libcXmusl-aarch64.so',
		'/lib/ld-musl.so', '/lib/libcmusl-aarch64.so', '/lib/musl.so', '']) {
		assert.throws(() => detectLinuxLibc(() => ({ sharedObjects: [path] }), unavailable), unknown, path);
	}
});

test('libc: a failed detection does not affect a later successful call', () => {
	assert.throws(() => detectLinuxLibc(unavailable, unavailable), unknown);
	assert.equal(detectLinuxLibc(() => ({ header: { glibcVersionRuntime: '2.39' } }), unavailable), 'gnu');
	assert.equal(detectLinuxLibc(unavailable, () => 'musl'), 'musl');
});
