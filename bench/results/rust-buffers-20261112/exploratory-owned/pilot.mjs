import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const runs = [];
for (let round = 0; round < 3; round++) {
	for (const variant of (round % 2 ? ['owned', 'before'] : ['before', 'owned'])) {
		const value = JSON.parse(execFileSync(process.execPath, ['--expose-gc', '--import', resolve('target/rust-buffers/pilot-hook.mjs'), 'bench/competitors/worker.mjs', 'native'], { encoding: 'utf8', env: { ...process.env, SELECTION_API: resolve(`target/rust-buffers/${variant}/dist/native.mjs`) } }));
		runs.push({ variant, round, ...value, variant });
		writeFileSync('target/rust-buffers/owned-pilot.json', JSON.stringify({ protocol: 'Exploratory only: 3 processes per variant, 20 ms warmup plus unchanged minimum iterations, 50 ms timed, all 64 cases.', runs }, null, 2));
	}
}
