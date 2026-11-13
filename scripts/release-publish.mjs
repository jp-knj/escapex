// Publish only the archives produced by a successful release-candidate workflow.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { targets } from './native-targets.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
assert(args.filter(arg => arg === '--dry-run').length <= 1 && args.every(arg => !arg.startsWith('--') || arg === '--dry-run'));
const paths = args.filter(arg => arg !== '--dry-run');
assert(paths.length <= 1, 'Usage: release:publish -- [--dry-run] [candidate-directory]');
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, paths[0] ?? 'target/release-candidate');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'));
assert.equal(manifest.version, metadata.version);
assert.match(manifest.commit, /^[0-9a-f]{40}$/);
assert.match(manifest.runId, /^\d+$/);
assert.equal(manifest.published, false);
const names = [...targets.map(target => metadata.name + '-' + target.id), metadata.name];
assert.deepEqual(manifest.packages.map(pkg => pkg.name), names, 'Expected eight native packages followed by the main package');
for (const pkg of manifest.packages) {
	assert.equal(pkg.version, metadata.version);
	assert.equal(pkg.file, pkg.name.replace(/^@/, '').replace('/', '-') + '-' + pkg.version + '.tgz');
	const file = join(directory, pkg.file), bytes = readFileSync(file);
	assert.equal(bytes.length, pkg.size, 'Archive size mismatch: ' + pkg.name);
	assert.equal(createHash('sha256').update(bytes).digest('hex'), pkg.sha256, 'Archive hash mismatch: ' + pkg.name);
	assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), pkg.integrity);
	const packed = JSON.parse(execFileSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' }));
	assert.equal(packed.name, pkg.name);
	assert.equal(packed.version, pkg.version);
	if (pkg.name === metadata.name) assert.deepEqual(packed, metadata, 'Main package differs from the checked-out source');
}
assert.equal(readFileSync(join(directory, 'SHA256SUMS'), 'utf8'),
	manifest.packages.map(pkg => `${pkg.sha256}  ${pkg.file}\n`).join(''), 'SHA256SUMS differs from the manifest');
if (dryRun) {
	console.log('Verified ' + names.length + ' archives in publish order; no registry requests or writes');
	process.exit(0);
}
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Publishing requires GitHub Actions with OIDC');
assert.equal(process.env.GITHUB_REPOSITORY, 'jp-knj/escapex');
assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Publish from main only');
assert.equal(process.env.GITHUB_SHA, manifest.commit, 'Candidate source commit mismatch');
assert.equal(process.env.RELEASE_CANDIDATE_RUN_ID, manifest.runId, 'Candidate run mismatch');
assert(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'OIDC is unavailable');
assert(process.env.GH_TOKEN, 'GitHub Actions read access is required');
const response = await fetch('https://api.github.com/repos/jp-knj/escapex/actions/runs/' + manifest.runId, {
	headers: { Authorization: 'Bearer ' + process.env.GH_TOKEN, Accept: 'application/vnd.github+json' },
});
assert(response.ok, 'Cannot verify candidate workflow: HTTP ' + response.status);
const run = await response.json();
assert.equal(run.conclusion, 'success');
assert.equal(run.head_sha, manifest.commit);
assert.equal(run.path, '.github/workflows/release.yml');
const env = { ...process.env };
delete env.NPM_TOKEN;
delete env.NODE_AUTH_TOKEN;
const npm = process.env.npm_execpath ? [process.execPath, [process.env.npm_execpath]] : ['npm', []];
function registryIntegrity(pkg) {
	const result = spawnSync(npm[0], [...npm[1], 'view', pkg.name + '@' + pkg.version, 'dist.integrity', '--json',
		'--registry', 'https://registry.npmjs.org', '--fetch-retries=0', '--fetch-timeout=10000'], { env, encoding: 'utf8' });
	if (result.error) throw result.error;
	const data = JSON.parse(result.stdout || '{}');
	if (result.status === 0) return data;
	if (data.error?.code === 'E404') return null;
	throw new Error('Registry lookup failed for ' + pkg.name + ': ' + result.stderr);
}
// Check every existing version before publishing anything, so retries cannot mix builds.
const existing = new Set();
for (const pkg of manifest.packages) {
	const integrity = registryIntegrity(pkg);
	if (integrity === null) continue;
	assert.equal(integrity, pkg.integrity, 'Already published with different bytes: ' + pkg.name);
	existing.add(pkg.name);
}
const receipt = { commit: manifest.commit, candidateRunId: manifest.runId, packages: [] };
for (const pkg of manifest.packages) {
	if (!existing.has(pkg.name)) execFileSync(npm[0], [...npm[1], 'publish', join(directory, pkg.file),
		'--access', 'public', '--tag', 'latest', '--provenance', '--ignore-scripts',
		'--registry', 'https://registry.npmjs.org'], { env, stdio: 'inherit' });
	let integrity;
	for (let attempt = 0; attempt < 6; attempt++) {
		integrity = registryIntegrity(pkg);
		if (integrity !== null) break;
		await setTimeout(2000);
	}
	assert.equal(integrity, pkg.integrity, 'Published integrity mismatch: ' + pkg.name);
	receipt.packages.push({ name: pkg.name, version: pkg.version, integrity });
	writeFileSync(join(directory, 'publication.json'), JSON.stringify(receipt, null, 2) + '\n');
	console.log('Verified published package: ' + pkg.name + '@' + pkg.version);
}
