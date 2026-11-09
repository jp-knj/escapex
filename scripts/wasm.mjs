import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const wasmOpt = process.env.WASM_OPT ?? 'wasm-opt';
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
mkdirSync(join(root, 'dist'), { recursive: true });

for (const variant of ['scalar', 'simd']) {
	const target = join(root, 'target', `wasm-${variant}`);
	const flags = [
		`-Ctarget-feature=${variant === 'scalar' ? '-' : '+'}simd128`,
		'-Clink-arg=-zstack-size=65536', '-Clink-arg=--initial-memory=131072',
		'-Clink-arg=--max-memory=2147483648',
	].join(' ');
	run('cargo', ['build', '--manifest-path', 'rust/Cargo.toml', '--release', '--offline', '--locked',
		'--target', 'wasm32-unknown-unknown', '--target-dir', target], { env: { ...process.env, RUSTFLAGS: flags } });
	const compiled = join(target, 'wasm32-unknown-unknown/release/escape_html_wasm.wasm');
	const binary = join(root, 'dist', variant === 'simd' ? 'escape_html.wasm' : 'escape_html.scalar.wasm');
	if (variant === 'simd') run(wasmOpt, [compiled, '-O3', '--enable-simd', '--enable-bulk-memory',
		'--enable-nontrapping-float-to-int', '--strip-debug', '--strip-producers', '-o', binary]);
	else copyFileSync(compiled, binary);
	assert.deepEqual(WebAssembly.Module.imports(new WebAssembly.Module(readFileSync(binary))), []);
}
