import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('initial setup cannot be switched out of dry-run mode', () => {
	const result = spawnSync(process.execPath, ['scripts/release-setup.mjs', '--publish'], { cwd: root, encoding: 'utf8' });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /accepts no arguments and always uses --dry-run/);
	assert.equal(result.stdout, '');
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
