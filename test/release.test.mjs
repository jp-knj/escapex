import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { targets } from '../scripts/native-targets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('initial setup cannot be switched out of dry-run mode', () => {
	const result = spawnSync(process.execPath, ['scripts/release-setup.mjs', '--publish'], { cwd: root, encoding: 'utf8' });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /accepts no arguments and always uses --dry-run/);
	assert.equal(result.stdout, '');
});

test('placeholder publication requires its explicit flag', () => {
	const result = spawnSync(process.execPath, ['scripts/release-bootstrap.mjs'], { cwd: root, encoding: 'utf8' });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /--publish-placeholders/);
	assert.equal(result.stdout, '');
});

test('publication validates all archive hashes and the source commit before registry writes', () => {
	const directory = mkdtempSync(join(tmpdir(), 'html-escape-publish-'));
	try {
		const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
		const names = [...targets.map(target => metadata.name + '-' + target.id), metadata.name];
		const staging = join(directory, 'package');
		mkdirSync(staging);
		const packages = names.map(name => {
			writeFileSync(join(staging, 'package.json'), JSON.stringify(name === metadata.name ? metadata : { name, version: metadata.version }));
			const file = name.slice(1).replace('/', '-') + '-' + metadata.version + '.tgz';
			execFileSync('tar', ['-czf', join(directory, file), '-C', directory, 'package/package.json']);
			const bytes = readFileSync(join(directory, file));
			return { name, version: metadata.version, file, size: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
				integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') };
		});
		const manifest = { version: metadata.version, commit: 'a'.repeat(40), runId: '1', published: false, packages };
		const save = () => writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
		save();
		const run = (args, env = process.env) => spawnSync(process.execPath, ['scripts/release-publish.mjs', ...args, directory],
			{ cwd: root, env, encoding: 'utf8' });
		let result = run(['--dry-run']);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Verified 9 archives/);
		const hash = packages[0].sha256;
		packages[0].sha256 = '0'.repeat(64);
		save();
		result = run([]);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Archive hash mismatch/);
		packages[0].sha256 = hash;
		save();
		result = run([], { ...process.env, GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'jp-knj/html-escape',
			GITHUB_REF: 'refs/heads/main', GITHUB_SHA: 'b'.repeat(40) });
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Candidate source commit mismatch/);
		assert(!existsSync(join(directory, 'publication.json')));
	} finally { rmSync(directory, { recursive: true, force: true }); }
});

test('release assembly rejects missing and wrong-version native artifacts before creating output', () => {
	const directory = mkdtempSync(join(tmpdir(), 'html-escape-release-'));
	try {
		const artifacts = join(directory, 'artifacts'), output = join(directory, 'candidate');
		mkdirSync(artifacts);
		const run = () => spawnSync(process.execPath, ['scripts/release-pack.mjs', artifacts, output], { cwd: root, encoding: 'utf8' });
		let result = run();
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Missing tested platform tarball/);
		assert(!existsSync(output));

		const pkg = JSON.parse(readFileSync(join(root, 'npm/darwin-arm64/package.json'), 'utf8'));
		const filename = `${pkg.name.slice(1).replace('/', '-')}-${pkg.version}.tgz`;
		pkg.version = '0.0.0';
		const staging = join(directory, 'package');
		mkdirSync(staging);
		writeFileSync(join(staging, 'package.json'), JSON.stringify(pkg));
		writeFileSync(join(staging, 'LICENSE'), 'test fixture');
		writeFileSync(join(staging, pkg.main), 'not a release binary');
		const artifact = join(artifacts, 'native-darwin-arm64');
		mkdirSync(artifact);
		execFileSync('tar', ['-czf', join(artifact, filename), '-C', directory, 'package/package.json', 'package/LICENSE', `package/${pkg.main}`]);
		result = run();
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Native package version mismatch/);
		assert(!existsSync(output));
	} finally { rmSync(directory, { recursive: true, force: true }); }
});
