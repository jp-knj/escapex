// Assemble eight tested platform tarballs, the native installer and JS/Wasm.
// npm pack is local-only; this script has no publishing operation.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from './native-targets.mjs';
import { validateNativeMetadata } from './package-metadata.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert(process.argv.length <= 4, 'Usage: node scripts/release-pack.mjs [artifact-directory] [output-directory]');
const artifacts = resolve(root, process.argv[2] ?? 'target/release-artifacts');
const output = resolve(root, process.argv[3] ?? 'target/release-candidate');
assert(!existsSync(output) || readdirSync(output).length === 0, 'Use a new or empty output directory');
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const installer = JSON.parse(readFileSync(join(root, 'npm/native/package.json'), 'utf8'));
validateNativeMetadata(metadata, installer);
assert.match(metadata.version, /^\d+\.\d+\.\d+$/, 'Expected a stable release version');
assert.equal(metadata.publishConfig.access, 'public');
const packageFiles = metadata.files.filter(file => !file.endsWith('.node'));
for (const file of packageFiles) assert(existsSync(join(root, file)), `Build artifact missing: ${file}`);
const archiveName = name => `${name.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`;
const inspect = (file, expected) => {
	const entries = execFileSync('tar', ['-tzf', file], { encoding: 'utf8' }).trim().split(/\r?\n/);
	assert.deepEqual(entries.sort(), expected.map(path => `package/${path}`).sort(), `Unexpected archive contents: ${file}`);
	return JSON.parse(execFileSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' }));
};
const candidates = [];
for (const target of targets) {
	const name = `${metadata.name}-${target.id}`;
	assert.equal(installer.optionalDependencies[name], metadata.version);
	const file = join(artifacts, `native-${target.id}`, archiveName(name));
	assert(existsSync(file), `Missing tested platform tarball: ${file}`);
	const pkg = inspect(file, ['package.json', 'LICENSE', `escape_html.${target.id}.node`]);
	assert.equal(pkg.name, name);
	assert.equal(pkg.version, metadata.version, `Native package version mismatch: ${name}`);
	assert.equal(pkg.main, `escape_html.${target.id}.node`);
	assert.deepEqual(pkg.os, [target.os]);
	assert.deepEqual(pkg.cpu, [target.cpu]);
	assert.deepEqual(pkg.libc, target.libc ? [target.libc] : undefined);
	assert.equal(pkg.repository.url, metadata.repository.url);
	assert.equal(pkg.publishConfig.access, 'public');
	candidates.push({ name, source: file });
}
mkdirSync(output, { recursive: true });
const args = ['pack', '--json', '--ignore-scripts', '--pack-destination', output,
	'--cache', join(root, 'target/npm-cache')];
for (const candidate of candidates) copyFileSync(candidate.source, join(output, archiveName(candidate.name)));
for (const [cwd, pkg, files] of [[join(root, 'npm/native'), installer, ['README.md', 'LICENSE']], [root, metadata, packageFiles]]) {
	const [packed] = JSON.parse(execFileSync(process.env.npm_execpath ? process.execPath : 'npm',
		[...(process.env.npm_execpath ? [process.env.npm_execpath] : []), ...args], { cwd, encoding: 'utf8' }));
	assert.equal(packed.filename, archiveName(pkg.name));
	assert.deepEqual(inspect(join(output, packed.filename), [...files, 'package.json']), pkg);
	candidates.push({ name: pkg.name });
}
const packages = candidates.map(({ name }) => {
	const file = archiveName(name), bytes = readFileSync(join(output, file));
	return { name, version: metadata.version, file, size: bytes.length,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}` };
});
writeFileSync(join(output, 'manifest.json'), JSON.stringify({ version: metadata.version,
	commit: process.env.GITHUB_SHA ?? null, runId: process.env.GITHUB_RUN_ID ?? null,
	node: process.version, published: false, packages }, null, 2) + '\n');
writeFileSync(join(output, 'SHA256SUMS'), packages.map(pkg => `${pkg.sha256}  ${pkg.file}\n`).join(''));
console.log(`Prepared ${packages.length} tarballs at ${output}; nothing was published`);
