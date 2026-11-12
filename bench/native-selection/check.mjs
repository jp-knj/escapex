import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const folder = resolve(root, 'target/native-selection/results');
mkdirSync(folder, { recursive: true });
const outcomes = [];
for (const variant of ['routing', 'before', 'tail', 'expanded', 'combined']) {
	const args = variant === 'routing' ? ['--test', 'bench/native-selection/selection.test.mjs']
		: ['--import', new URL('./select.mjs', import.meta.url).href, '--test', 'test/native.test.mjs'];
	const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...process.env,
		SELECTION_API: resolve(root, `target/native-selection/${variant}/dist/native.mjs`) } });
	writeFileSync(resolve(folder, `node${process.versions.node.split('.')[0]}-${variant}.log`), result.stdout + result.stderr);
	outcomes.push({ variant, status: result.status, error: result.error?.message });
	console.log(`${variant}: ${result.status === 0 ? 'passed' : 'FAILED'}`);
}
writeFileSync(resolve(folder, `correctness-node${process.versions.node.split('.')[0]}.json`), JSON.stringify({ node: process.version, outcomes }, null, 2) + '\n');
if (outcomes.some(result => result.status !== 0)) process.exitCode = 1;
