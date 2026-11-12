import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const results = [];
for (const variant of ['before', 'capacity', 'reuse']) {
	const dir = join(root, 'target/rust-buffers', variant);
	copyFileSync(new URL('./allocation.rs', import.meta.url), join(dir, 'allocation.rs'));
	const binary = join(dir, `allocation${process.platform === 'win32' ? '.exe' : ''}`);
	execFileSync('rustc', ['--edition=2024', '-O', ...(variant === 'reuse' ? ['--cfg', 'reuse'] : []), join(dir, 'allocation.rs'), '-o', binary], { stdio: 'pipe' });
	const rows = execFileSync(binary, [], { encoding: 'utf8' }).trim().split('\n').map(line => JSON.parse(line));
	for (const row of rows) {
		assert.equal(row.allocations, variant === 'reuse' ? 0 : 1);
		assert.equal(row.reallocations, variant === 'reuse' ? 0 : (row.case === 'dense' ? 3 : 1) - (variant === 'capacity' ? 1 : 0));
	}
	results.push({ variant, rows });
}
const destination = join(root, 'target/rust-buffers/results');
mkdirSync(destination, { recursive: true });
writeFileSync(join(destination, 'allocation.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
