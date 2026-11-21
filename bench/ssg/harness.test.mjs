import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProfile, recordInput, mergeProfiles } from './profile.mjs';
import { hashOutput } from './output.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('input profiling counts UTF-16, every target, unchanged inputs, and thread totals', () => {
	const a = createProfile();
	const b = createProfile();
	recordInput(a, '\ud800🌸&<>\'"\udfff');
	recordInput(a, 'x'.repeat(16));
	recordInput(b, 'x'.repeat(17));
	recordInput(b, '');
	const combined = mergeProfiles([a, b]);
	assert.equal(combined.calls, 4);
	assert.equal(combined.units, 42);
	assert.equal(combined.targets, 5);
	assert.equal(combined.unchanged, 3);
	assert.equal(combined.lengths[0].calls, 3);
	assert.equal(combined.lengths[1].calls, 1);
	assert.equal(a.calls, 2, 'Merging must not mutate individual thread records');
});

test('output verification detects same-length changes, file names, and non-HTML assets', async () => {
	const root = await mkdtemp(join(tmpdir(), 'escape-ssg-'));
	try {
		await mkdir(join(root, 'page'));
		await writeFile(join(root, 'page/index.html'), '<p>&amp;</p>');
		await writeFile(join(root, 'style.css'), 'a{color:red}');
		const original = await hashOutput(root);
		assert.equal(original.htmlFiles, 1);
		assert.equal(original.files, 2);
		await writeFile(join(root, 'style.css'), 'b{color:red}');
		assert.notEqual((await hashOutput(root)).sha256, original.sha256);
		await writeFile(join(root, 'style.css'), 'a{color:red}');
		assert.deepEqual(await hashOutput(root), original);
		await rename(join(root, 'page'), join(root, 'other'));
		assert.notEqual((await hashOutput(root)).sha256, original.sha256);
	} finally { await rm(root, { recursive: true, force: true }); }
});

test('SSG replay and rendering adapter select the public default ESM function', async () => {
	const root = await mkdtemp(join(tmpdir(), 'escape-ssg-esm-'));
	try {
		const file = join(root, 'inputs.json');
		await writeFile(file, JSON.stringify(['plain', '<&\'"', '\ud800日本😀\udfff', '\r\n', 'a'.repeat(256) + '&']));
		const replay = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('./cost-worker.mjs', import.meta.url)), 'esm', file], { encoding: 'utf8' }));
		assert.equal(replay.variant, 'esm');
		assert.equal(replay.callsPerCorpus, 5);
		assert(replay.msPerCorpus > 0 && replay.iterations > 0 && replay.warmup > 0);
		const adapter = new URL('./adapter.mjs', import.meta.url).href;
		const api = new URL('../../dist/index.mjs', import.meta.url).href;
		execFileSync(process.execPath, ['--input-type=module', '-e',
			`import assert from 'node:assert/strict'; import { escapeHTML } from ${JSON.stringify(adapter)}; import * as api from ${JSON.stringify(api)}; assert.equal(escapeHTML, api.escapeHTML);`], {
			env: { ...process.env, SSG_VARIANT: 'esm', SSG_RUN_DIR: root, SSG_PROFILE: '0' },
		});
	} finally { await rm(root, { recursive: true, force: true }); }
});
