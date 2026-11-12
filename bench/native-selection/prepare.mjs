import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { candidate } from './variants.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = resolve(root, 'target/native-selection');
const before = await readFile(new URL('./before.ts', import.meta.url), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const binaries = (await readdir(join(root, 'dist/native'))).filter(file => file.endsWith('.node'));
assert(binaries.length, 'Build the native addon before preparing the comparison');
const manifest = { baselineCommit: 'eda293bec2bc54e9e77c3d206bebb586bb635087', baselineSource: hash(before), variants: {}, binaries: {} };
for (const binary of binaries) manifest.binaries[binary] = hash(await readFile(join(root, 'dist/native', binary)));
for (const [name, options] of Object.entries({ before: {}, tail: { tail: true }, expanded: { expanded: true }, combined: { tail: true, expanded: true } })) {
	const dir = join(destination, name);
	await mkdir(dir, { recursive: true });
	await cp(join(root, 'src'), join(dir, 'src'), { recursive: true, filter: path => !path.includes(join('src', 'rust')) });
	await cp(join(root, 'tsdown.config.mts'), join(dir, 'tsdown.config.mts'));
	await cp(join(root, 'package.json'), join(dir, 'package.json'));
	const source = candidate(before, options);
	await writeFile(join(dir, 'src/native.ts'), source);
	execFileSync(process.execPath, [join(root, 'node_modules/tsdown/dist/run.mjs')], { cwd: dir, stdio: 'inherit' });
	await cp(join(root, 'dist/native'), join(dir, 'dist/native'), { recursive: true });
	// Each variant uses the identical shared JS core, type declarations and addon.
	for (const file of ['escape-core.mjs', 'native.d.mts']) {
		assert.deepEqual(await readFile(join(dir, 'dist', file)), await readFile(join(root, 'dist', file)), file);
	}
	manifest.variants[name] = { source: hash(source), api: hash(await readFile(join(dir, 'dist/native.mjs'))) };
}
await writeFile(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
