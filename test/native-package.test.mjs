import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { preparePackage, packageName, metadata, root } from '../scripts/package-fixture.mjs';
import { targets } from '../scripts/native-targets.mjs';
import { validateNativeMetadata } from '../scripts/package-metadata.mjs';

let fixture;
before(async () => { fixture = await preparePackage({ native: true }); });
after(async () => { if (fixture) await rm(fixture.consumer, { recursive: true, force: true }); });
const run = (code) => execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: fixture.consumer, stdio: 'pipe' });

test('installed usage example renders serialized JSON in a native data attribute', async () => {
	const guide = await readFile(join(fixture.installed, 'USAGE.md'), 'utf8');
	const example = [...guide.matchAll(/```js\r?\n([\s\S]*?)```/g)]
		.map(match => match[1]).find(code => code.includes("from 'escapex/native'"));
	assert(example, 'Native usage example is present');
	run(example + `\nimport assert from 'node:assert/strict';
assert.equal(html, '<div data-props="{&quot;title&quot;:&quot;日本語 😀 \\\\&quot;quoted\\\\&quot;&quot;}"></div>');`);
});

test('npm tarballs: ESM import, all exports and concurrent Workers', () => {
	run(`
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import * as api from '${packageName}/native';
import * as reference from '${packageName}';
assert.deepEqual(Object.keys(api), Object.keys(reference));
const input = '\\ud800&<>\\0\\udfff\\r\\n"';
for (const value of [input, input.repeat(2048)]) {
  for (const name of Object.keys(reference)) assert.equal(api[name](value), reference[name](value));
}
assert.equal(api.escape, api.escapeHTML);
assert.equal(api.unescape, api.unescapeHTML);
await Promise.all(Array.from({ length: 4 }, (_, index) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL(${JSON.stringify(new URL('./fixtures/native-worker.mjs', import.meta.url).href)}), {
    execArgv: [], workerData: { specifier: import.meta.resolve('${packageName}/native'), index }
  });
  worker.on('error', reject);
  worker.on('exit', code => code === 0 ? resolve() : reject(new Error('worker exit ' + code)));
})));
`);
});

test('npm tarballs: missing and corrupt native binaries report causes; default import still works', async () => {
	const dir = join(fixture.consumer, 'node_modules', fixture.nativePackage);
	await rename(dir, `${dir}.saved`);
	try {
		run(`
import assert from 'node:assert/strict';
import { escape } from '${packageName}';
assert.equal(escape('&'), '&amp;');
await assert.rejects(import('${packageName}/native'), error => /Cannot load.*optional dependencies/.test(error.message) && error.cause.code === 'MODULE_NOT_FOUND');
`);
	} finally { await rename(`${dir}.saved`, dir); }
	const binary = join(dir, JSON.parse(await readFile(join(dir, 'package.json'))).main);
	await rename(binary, `${binary}.saved`);
	try {
		await writeFile(binary, 'invalid native addon');
		run(`
import assert from 'node:assert/strict';
await assert.rejects(import('${packageName}/native'), error => /Cannot load/.test(error.message) && error.cause.code === 'ERR_DLOPEN_FAILED');
`);
	} finally { await rm(binary, { force: true }); await rename(`${binary}.saved`, binary); }
});

test('npm tarballs: absent and corrupt installer fail at import with installation instructions', async () => {
	const dir = join(fixture.consumer, 'node_modules', fixture.nativeInstaller);
	await rename(dir, `${dir}.saved`);
	try {
		run(`
import assert from 'node:assert/strict';
await assert.rejects(import('${packageName}/native'), error =>
  error.message.includes('npm install escapex escapex-native') && error.cause.code === 'MODULE_NOT_FOUND');
`);
	} finally { await rename(`${dir}.saved`, dir); }
	const manifest = join(dir, 'package.json'), original = await readFile(manifest);
	try {
		await writeFile(manifest, 'invalid JSON');
		run(`
import assert from 'node:assert/strict';
await assert.rejects(import('${packageName}/native'), error =>
  error.message.includes('npm install escapex escapex-native') && /JSON|package config/i.test(error.cause.message));
`);
	} finally { await writeFile(manifest, original); }
});

test('npm tarballs: nested platform dependencies and multiple independent installations', async () => {
	const modules = join(fixture.consumer, 'node_modules');
	const nested = join(modules, fixture.nativeInstaller, 'node_modules');
	await mkdir(nested, { recursive: true });
	await rename(join(modules, fixture.nativePackage), join(nested, fixture.nativePackage));
	const second = join(fixture.consumer, 'second');
	try {
		// A second installation has its own installer and nested platform binary.
		await cp(modules, join(second, 'node_modules'), { recursive: true });
		await writeFile(join(second, 'entry.mjs'), `export * from '${packageName}/native';\n`);
		run(`
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import * as reference from '${packageName}';
const entries = [import.meta.resolve('${packageName}/native'), pathToFileURL(${JSON.stringify(join(second, 'entry.mjs'))}).href];
assert.notEqual(entries[0], entries[1]);
const apis = await Promise.all(entries.map(entry => import(entry)));
assert.notEqual(apis[0].escape, apis[1].escape);
for (const api of apis) {
  for (const name of Object.keys(reference)) {
    const input = '&<>"\\r\\n日本語\\ud800'.repeat(2048);
    assert.equal(api[name](input), reference[name](input));
  }
}
await Promise.all(entries.map((specifier, index) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL(${JSON.stringify(new URL('./fixtures/native-worker.mjs', import.meta.url).href)}), {
    execArgv: [], workerData: { specifier, index }
  });
  worker.on('error', reject);
  worker.on('exit', code => code === 0 ? resolve() : reject(new Error('worker exit ' + code)));
})));
`);
	} finally {
		await rename(join(nested, fixture.nativePackage), join(modules, fixture.nativePackage));
		await rm(second, { recursive: true, force: true });
	}
});

test('native package manifests have matching versions and platform restrictions', async () => {
	const installer = JSON.parse(await readFile(join(root, 'npm/native/package.json')));
	validateNativeMetadata(metadata, installer);
	const lock = JSON.parse(await readFile(join(root, 'package-lock.json')));
	assert.deepEqual(lock.packages[''].peerDependencies, metadata.peerDependencies);
	assert.deepEqual(lock.packages[''].peerDependenciesMeta, metadata.peerDependenciesMeta);
	assert.equal(lock.packages[''].optionalDependencies, undefined);
	assert(!Object.keys(lock.packages).some(name => name.startsWith('node_modules/escapex-')));
	for (const target of targets) {
		const pkg = JSON.parse(await readFile(join(root, 'npm', target.id, 'package.json')));
		assert.equal(installer.optionalDependencies[pkg.name], pkg.version);
		assert.equal(pkg.version, metadata.version);
		assert.deepEqual(pkg.os, [target.os]); assert.deepEqual(pkg.cpu, [target.cpu]);
		assert.deepEqual(pkg.libc, target.libc ? [target.libc] : undefined);
	}
	const before = await readFile(join(root, 'package-lock.json'));
	execFileSync(process.execPath, ['scripts/native.mjs', '--metadata', '--target', targets[0].triple], { cwd: root, stdio: 'pipe' });
	assert.deepEqual(await readFile(join(root, 'package-lock.json')), before, 'Metadata generation must not modify the root lockfile');
});
