import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from '../../scripts/native-targets.mjs';
import { capacity, reuse } from './variants.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = join(root, 'target/rust-buffers');
const triple = execFileSync('rustc', ['-vV'], { encoding: 'utf8' }).match(/^host: (.+)$/m)[1].trim();
const target = targets.find(entry => entry.triple === triple);
assert(target, triple);
const hash = value => createHash('sha256').update(value).digest('hex');
const manifest = { baselineCommit: 'eda293bec2bc54e9e77c3d206bebb586bb635087', target, variants: {} };
const source = await readFile(new URL('./before/native_escape.rs', import.meta.url), 'utf8');
for (const [name, transform] of Object.entries({ before: value => value, 'html-only': reuse })) {
	const dir = join(destination, name);
	await mkdir(dir, { recursive: true });
	await cp(join(root, 'src/rust'), join(dir, 'rust'), { recursive: true });
	for (const file of ['native_escape.rs', 'napi_bindings.rs', 'lib.rs']) {
		await cp(new URL(`./before/${file}`, import.meta.url), join(dir, 'rust/src', file));
	}
	await writeFile(join(dir, 'rust/src/native_escape.rs'), transform(source));
	if (name === 'html-only') {
		for (const file of ['native_buffer.rs', 'napi_bindings.rs']) await cp(new URL(file === 'napi_bindings.rs' ? './html-only-bindings.rs' : `./${file}`, import.meta.url), join(dir, 'rust/src', file));
		const lib = await readFile(join(dir, 'rust/src/lib.rs'), 'utf8');
		await writeFile(join(dir, 'rust/src/lib.rs'), lib + '\n#[cfg(any(test, feature = "native"))]\nmod native_buffer;\n');
	}
	const cargo = ['--manifest-path', join(dir, 'rust/Cargo.toml')];
	execFileSync('cargo', ['fmt', ...cargo], { cwd: root, stdio: 'inherit' });
	const flags = target.libc === 'musl' ? '-C target-feature=-crt-static' : '';
	execFileSync('cargo', ['build', ...cargo, '--release', '--locked', '--offline', '--features', 'native', '--target', triple,
		'--target-dir', join(destination, 'build')], { cwd: root, stdio: 'inherit',
		env: { ...process.env, RUSTFLAGS: flags, CARGO_ENCODED_RUSTFLAGS: flags ? '-C\x1ftarget-feature=-crt-static' : '' } });
	await cp(join(root, 'dist'), join(dir, 'dist'), { recursive: true });
	const library = target.os === 'win32' ? 'escape_html_wasm.dll' : `libescape_html_wasm.${target.os === 'darwin' ? 'dylib' : 'so'}`;
	const binary = `escape_html.${target.id}.node`;
	await mkdir(join(dir, 'dist/native'), { recursive: true });
	await cp(join(destination, 'build', triple, 'release', library), join(dir, 'dist/native', binary));
	manifest.variants[name] = { api: hash(await readFile(join(dir, 'dist/native.mjs'))), binary,
		addon: hash(await readFile(join(dir, 'dist/native', binary))), source: hash(await readFile(join(dir, 'rust/src/native_escape.rs'))) };
	assert.equal(manifest.variants[name].api, manifest.variants.before.api);
}
await writeFile(join(destination, 'html-only-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
