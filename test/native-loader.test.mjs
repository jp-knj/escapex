import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadNativeBinding } from '../src/native-loader.ts';
import { nativePlatform } from '../src/native-platform.ts';
import { detectLinuxLibc } from '../src/native-libc.ts';

// These are literal package suffixes, independent of the platform selector.
const ids = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-x64-gnu',
	'linux-arm64-musl', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc'];
const cache = createRequire(import.meta.url).cache;
const message = id => `Cannot load escapex/native for ${id}. Install escapex-${id} at the same version with optional dependencies enabled, or run npm run build:native in the source checkout.`;

function fixture(t) {
	const root = realpathSync(mkdtempSync(join(tmpdir(), 'escapex loader # 日本語 ')));
	const entry = join(root, 'dist', 'native.mjs');
	mkdirSync(join(root, 'dist', 'native'), { recursive: true });
	t.after(() => {
		for (const key of Object.keys(cache)) if (key.startsWith(root + sep)) delete cache[key];
		rmSync(root, { recursive: true, force: true });
	});
	const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); return path; };
	return {
		root, entry, url: pathToFileURL(entry).href,
		local(id) { return write(join(root, 'dist', 'native', `escape_html.${id}.node`), 'invalid native addon'); },
		package(id, code = 'module.exports = { origin: "optional" };', main = 'index.cjs') {
			const dir = join(root, 'node_modules', `escapex-${id}`);
			write(join(dir, 'package.json'), JSON.stringify({ name: `escapex-${id}`, main }));
			return write(join(dir, main), code);
		},
	};
}

// Successful local loading uses Node's module cache. All path resolution,
// existence checks, optional-package execution, and failed dlopen calls are real.
function cached(path, exports) {
	const module = new Module(path);
	module.filename = path;
	module.loaded = true;
	module.exports = exports;
	cache[path] = module;
}

function checkError(error, id, code) {
	assert.equal(error.constructor, Error);
	assert.equal(error.message, message(id));
	assert(Object.hasOwn(error, 'cause'));
	assert.notEqual(error.cause, error);
	if (code) assert.equal(error.cause.code, code);
	return true;
}

test('native loader: local binaries take precedence for every package suffix and encoded module URL', t => {
	for (const id of ids) {
		const f = fixture(t);
		const binding = { origin: 'local', id };
		cached(f.local(id), binding);
		const optional = f.package(id, 'throw new Error("optional package must not execute");');
		assert.equal(loadNativeBinding(id, f.url), binding);
		assert.equal(cache[optional], undefined);
	}
});

test('native loader: absent local binaries select each optional package relative to the entry', t => {
	for (const id of ids) {
		const f = fixture(t);
		const optional = f.package(id, `module.exports = { origin: "optional", id: ${JSON.stringify(id)} };`);
		const binding = loadNativeBinding(id, f.url);
		assert.deepEqual(binding, { origin: 'optional', id });
		assert.equal(binding, cache[optional].exports);
		assert.equal(loadNativeBinding(id, f.url), binding, 'Node module identity is preserved');
	}
});

test('native loader: separate installations resolve their own optional package', t => {
	const id = 'linux-x64-gnu';
	const first = fixture(t), second = fixture(t);
	first.package(id, 'module.exports = { installation: "first" };');
	second.package(id, 'module.exports = { installation: "second" };');
	assert.deepEqual(loadNativeBinding(id, first.url), { installation: 'first' });
	assert.deepEqual(loadNativeBinding(id, second.url), { installation: 'second' });
});

test('native loader: missing binaries identify the platform, package, recovery options, and cause', t => {
	for (const id of ids) {
		const f = fixture(t);
		assert.throws(() => loadNativeBinding(id, f.url), error => {
			checkError(error, id, 'MODULE_NOT_FOUND');
			assert(error.cause.message.includes(`'escapex-${id}'`));
			return true;
		});
	}
});

test('native loader: a corrupt local binary fails without executing an available optional package', t => {
	const id = 'darwin-arm64';
	const f = fixture(t);
	f.local(id);
	const optional = f.package(id);
	assert.throws(() => loadNativeBinding(id, f.url), error => checkError(error, id, 'ERR_DLOPEN_FAILED'));
	assert.equal(cache[optional], undefined);
});

test('native loader: a corrupt optional binary retains the dlopen failure', t => {
	const id = 'win32-x64-msvc';
	const f = fixture(t);
	f.package(id, 'invalid native addon', 'binding.node');
	assert.throws(() => loadNativeBinding(id, f.url), error => checkError(error, id, 'ERR_DLOPEN_FAILED'));
});

test('native loader: package initialization preserves thrown values as the exact cause', t => {
	for (const cause of [new Error('initialization failed'), { code: 'CUSTOM' }, undefined, null, 'failure', Symbol('cause')]) {
		const id = 'linux-arm64-musl';
		const f = fixture(t);
		const optional = f.package(id, 'throw require("./cause.cjs");');
		const path = join(dirname(optional), 'cause.cjs');
		writeFileSync(path, '');
		cached(path, cause);
		assert.throws(() => loadNativeBinding(id, f.url), error => {
			checkError(error, id);
			assert.equal(error.cause, cause);
			return true;
		});
	}
});

test('native loader: the bundled native entry fails eagerly for missing and corrupt local binaries', async t => {
	const libc = process.platform === 'linux'
		? detectLinuxLibc(() => process.report.getReport(), () => readFileSync('/usr/bin/ldd', 'utf8')) : undefined;
	const id = nativePlatform(process.platform, process.arch, libc);
	for (const corrupt of [false, true]) {
		const f = fixture(t);
		for (const name of ['native.mjs', 'index.mjs', 'escape-core.mjs']) {
			copyFileSync(new URL(`../dist/${name}`, import.meta.url), join(f.root, 'dist', name));
		}
		if (corrupt) { f.local(id); f.package(id); }
		await assert.rejects(import(f.url), error => checkError(error, id, corrupt ? 'ERR_DLOPEN_FAILED' : 'MODULE_NOT_FOUND'));
		const esm = await import(pathToFileURL(join(f.root, 'dist', 'index.mjs')));
		assert.equal(esm.escape('&'), '&amp;', 'default ESM remains usable after native import fails');
	}
});
