// Build the pinned, previously measured kernel using the current toolchain.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from '../../scripts/native-targets.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = resolve(process.argv[2] ?? 'target/tuning-baseline');
const commit = '79c0f63ea166dceabebb79279cb3c560cb3c1fc0';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: baseline, encoding: 'utf8' }).trim(), commit);
// Only the Rust kernel changes: reuse the exact same generated ESM and loader.
// The pinned predecessor keeps its Rust crate at the repository root.
for (const [file, current] of [
	['src/native.ts', 'src/native.ts'],
	['src/native-platform.ts', 'src/native-platform.ts'],
	['src/escape-html.ts', 'src/escape.ts'],
	['src/index.ts', 'src/index.ts'],
	['src/unescape-html.ts', 'src/unescape.ts'],
	['rust/Cargo.toml', 'src/rust/Cargo.toml'],
	['rust/Cargo.lock', 'src/rust/Cargo.lock'],
]) {
	// Import path renames do not change the implementation being compared.
	const normalized = path => readFileSync(path, 'utf8').replaceAll('\r\n', '\n')
		.replaceAll('./escape-html.ts', './escape.ts').replaceAll('./unescape-html.ts', './unescape.ts');
	assert.equal(normalized(join(baseline, file)), normalized(join(root, current)), `${file} differs from the baseline`);
}
const triple = execFileSync('rustc', ['-vV'], { encoding: 'utf8' }).match(/^host: (.+)$/m)[1].trim();
const target = targets.find(t => t.triple === triple);
assert(target);
const targetDir = join(root, 'target/native-before');
const flags = target.libc === 'musl' ? '-C target-feature=-crt-static' : '';
execFileSync('cargo', ['build', '--manifest-path', join(baseline, 'rust/Cargo.toml'), '--release', '--locked', '--offline',
	'--features', 'native', '--target', triple, '--target-dir', targetDir], {
	stdio: 'inherit', env: { ...process.env, RUSTFLAGS: flags, CARGO_ENCODED_RUSTFLAGS: flags ? '-C\x1ftarget-feature=-crt-static' : '' },
});
const api = join(root, 'target/ssg-tuning/before-api');
mkdirSync(join(api, 'native'), { recursive: true });
for (const file of ['native.mjs', 'escape-core.mjs']) copyFileSync(join(root, 'dist', file), join(api, file));
const library = target.os === 'win32' ? 'escape_html_wasm.dll' : `libescape_html_wasm.${target.os === 'darwin' ? 'dylib' : 'so'}`;
copyFileSync(join(targetDir, triple, 'release', library), join(api, 'native', `escape_html.${target.id}.node`));
writeFileSync(join(api, 'source.json'), JSON.stringify({ commit, triple, rustc: execFileSync('rustc', ['-V'], { encoding: 'utf8' }).trim() }, null, 2) + '\n');
