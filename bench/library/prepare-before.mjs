// Build both the JavaScript and native API of the pinned predecessor.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = resolve(process.argv[2] ?? 'target/library-baseline');
const commit = process.env.LIBRARY_BASELINE_COMMIT ?? 'cf51cdce642d3a45d044d0e5eb61f89dab48319e';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: baseline, encoding: 'utf8' }).trim(), commit);
for (const file of ['package-lock.json', 'rust/Cargo.toml', 'rust/Cargo.lock', 'tsdown.config.mts']) {
	const text = folder => readFileSync(join(folder, file), 'utf8').replaceAll('\r\n', '\n');
	assert.equal(text(baseline), text(root), `${file}: tools must match the predecessor`);
}
const packageDir = join(root, 'node_modules/tsdown');
const { bin } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
const cli = join(packageDir, typeof bin === 'string' ? bin : bin.tsdown);
execFileSync(process.execPath, [cli], { cwd: baseline, stdio: 'inherit' });
execFileSync(process.execPath, [join(baseline, 'scripts/native.mjs')], { cwd: baseline, stdio: 'inherit' });
const destination = join(root, 'target/library-tuning/before-api');
mkdirSync(join(destination, 'native'), { recursive: true });
for (const file of ['native.mjs', 'escape-core.mjs']) copyFileSync(join(baseline, 'dist', file), join(destination, file));
for (const file of readdirSync(join(baseline, 'dist/native'))) {
	if (file.endsWith('.node')) copyFileSync(join(baseline, 'dist/native', file), join(destination, 'native', file));
}
const sources = Object.fromEntries(['src/native.ts', 'src/escape-html.ts', 'rust/src/native.rs', 'rust/src/native_escape.rs'].map(file => [file,
	createHash('sha256').update(readFileSync(join(baseline, file))).digest('hex')]));
writeFileSync(join(destination, 'source.json'), JSON.stringify({ commit, sources }, null, 2) + '\n');
