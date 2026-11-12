import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = join(root, 'target/rust-buffers');
mkdirSync(join(destination, 'html-only-results'), { recursive: true });
for (const variant of ['before', 'html-only']) {
	const common = ['--manifest-path', join(destination, variant, 'rust/Cargo.toml')];
	for (const [name, args] of [
		['fmt', ['fmt', ...common, '--check']],
		['tests', ['test', ...common, '--release', '--locked', '--offline', '--target-dir', join(destination, 'test-build'), '--', '--nocapture']],
		['clippy', ['clippy', ...common, '--release', '--locked', '--offline', '--features', 'native', '--target-dir', join(destination, 'build'), '--', '-D', 'warnings']],
	]) {
		const result = spawnSync('cargo', args, { cwd: root, encoding: 'utf8' });
		writeFileSync(join(destination, 'html-only-results', `${variant}-${name}.log`), result.stdout + result.stderr);
		if (result.status !== 0) throw new Error(`${variant} ${name}: ${result.stdout}${result.stderr}`);
		console.log(`${variant} ${name}: passed`);
	}
}
