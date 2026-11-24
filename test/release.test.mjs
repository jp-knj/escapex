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
		const installer = JSON.parse(readFileSync(join(root, 'npm/native/package.json'), 'utf8'));
		const names = [...targets.map(target => metadata.name + '-' + target.id), installer.name, metadata.name];
		const staging = join(directory, 'package');
		mkdirSync(staging);
		const packages = names.map(name => {
			writeFileSync(join(staging, 'package.json'), JSON.stringify(name === metadata.name ? metadata
				: name === installer.name ? installer : { name, version: metadata.version }));
			const file = name.replace(/^@/, '').replace('/', '-') + '-' + metadata.version + '.tgz';
			execFileSync('tar', ['-czf', join(directory, file), '-C', directory, 'package/package.json']);
			const bytes = readFileSync(join(directory, file));
			return { name, version: metadata.version, file, size: bytes.length,
				sha256: createHash('sha256').update(bytes).digest('hex'),
				integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') };
		});
		const manifest = { version: metadata.version, commit: 'a'.repeat(40), runId: '1', published: false, packages };
		const save = () => {
			writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
			writeFileSync(join(directory, 'SHA256SUMS'), packages.map(pkg => `${pkg.sha256}  ${pkg.file}\n`).join(''));
		};
		save();
		const run = (args, env = process.env) => spawnSync(process.execPath, ['scripts/release-publish.mjs', ...args, directory],
			{ cwd: root, env, encoding: 'utf8' });
		let result = run(['--dry-run']);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Verified 10 archives/);
		assert.equal(packages.at(-1).file, `escapex-${metadata.version}.tgz`);
		assert.equal(packages.at(-2).file, `escapex-native-${metadata.version}.tgz`);
		[packages[8], packages[9]] = [packages[9], packages[8]];
		save();
		result = run(['--dry-run']);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Expected eight platform packages, native installer, then main package/);
		[packages[8], packages[9]] = [packages[9], packages[8]];
		save();
		writeFileSync(join(directory, 'SHA256SUMS'), 'invalid checksums\n');
		result = run(['--dry-run']);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /SHA256SUMS differs/);
		save();
		const hash = packages[0].sha256;
		packages[0].sha256 = '0'.repeat(64);
		save();
		result = run([]);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Archive hash mismatch/);
		packages[0].sha256 = hash;
		save();
		result = run([], { ...process.env, GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'jp-knj/escapex',
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
		const filename = `${pkg.name.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`;
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

test('release assembly preserves eight input archives and adds the installer before the main package', () => {
	const directory = mkdtempSync(join(tmpdir(), 'html-escape-assembly-'));
	try {
		const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
		const artifacts = join(directory, 'artifacts'), output = join(directory, 'candidate');
		const staging = join(directory, 'package');
		const expectedNames = [];
		for (const target of targets) {
			const pkg = JSON.parse(readFileSync(join(root, 'npm', target.id, 'package.json'), 'utf8'));
			expectedNames.push(pkg.name);
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'package.json'), JSON.stringify(pkg));
			writeFileSync(join(staging, 'LICENSE'), 'test fixture');
			writeFileSync(join(staging, pkg.main), `packaging test fixture for ${target.id}; not executable`);
			const artifact = join(artifacts, `native-${target.id}`);
			mkdirSync(artifact, { recursive: true });
			execFileSync('tar', ['-czf', join(artifact, `${pkg.name}-${pkg.version}.tgz`), '-C', directory,
				'package/package.json', 'package/LICENSE', `package/${pkg.main}`]);
			rmSync(staging, { recursive: true });
		}
		expectedNames.push(`${metadata.name}-native`, metadata.name);
		execFileSync(process.execPath, ['scripts/release-pack.mjs', artifacts, output], {
			cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ID: '1' },
		});
		const manifest = JSON.parse(readFileSync(join(output, 'manifest.json'), 'utf8'));
		assert.equal(manifest.packages.length, 10);
		assert.deepEqual(manifest.packages.map(pkg => pkg.name), expectedNames);
		for (const [index, target] of targets.entries()) {
			const { file } = manifest.packages[index];
			assert.deepEqual(readFileSync(join(output, file)), readFileSync(join(artifacts, `native-${target.id}`, file)));
		}
		const installer = join(output, manifest.packages.at(-2).file);
		assert.deepEqual(execFileSync('tar', ['-tzf', installer], { encoding: 'utf8' }).trim().split(/\r?\n/).sort(),
			['package/LICENSE', 'package/README.md', 'package/package.json']);
		const verified = execFileSync(process.execPath, ['scripts/release-publish.mjs', '--dry-run', output], { cwd: root, encoding: 'utf8' });
		assert.match(verified, /Verified 10 archives/);
		for (const options of [['--all-native'], ['--native', targets.at(-1).id]]) {
			const reportPath = join(directory, 'sizes.json');
			execFileSync(process.execPath, ['scripts/package-size.mjs', ...options, '--output', reportPath], {
				cwd: root, encoding: 'utf8', env: { ...process.env, RELEASE_CANDIDATE_DIR: output },
			});
			const sizes = JSON.parse(readFileSync(reportPath, 'utf8'));
			assert.equal(sizes.native.length, options[0] === '--all-native' ? 8 : 1);
			assert.equal(sizes.native.at(-1).name, `escapex-${targets.at(-1).id}`);
			assert(sizes.browser.escapeText < sizes.browser.all, 'Individual imports retain tree shaking');
		}
		// An installer archive with different metadata must fail even if its
		// checksums have been recomputed consistently in the candidate manifest.
		const changed = JSON.parse(readFileSync(join(root, 'npm/native/package.json'), 'utf8'));
		changed.optionalDependencies = {};
		mkdirSync(staging);
		writeFileSync(join(staging, 'package.json'), JSON.stringify(changed));
		execFileSync('tar', ['-czf', installer, '-C', directory, 'package/package.json']);
		const bytes = readFileSync(installer), entry = manifest.packages.at(-2);
		entry.size = bytes.length;
		entry.sha256 = createHash('sha256').update(bytes).digest('hex');
		entry.integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
		writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest));
		writeFileSync(join(output, 'SHA256SUMS'), manifest.packages.map(pkg => `${pkg.sha256}  ${pkg.file}\n`).join(''));
		const rejected = spawnSync(process.execPath, ['scripts/release-publish.mjs', '--dry-run', output], { cwd: root, encoding: 'utf8' });
		assert.notEqual(rejected.status, 0);
		assert.match(rejected.stderr, /Native installer differs from the checked-out source/);
	} finally { rmSync(directory, { recursive: true, force: true }); }
});
