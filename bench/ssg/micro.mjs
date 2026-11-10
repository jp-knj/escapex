// Reuse the existing 25-case worker, consuming every result with byteLength.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { median } from '../stats.mjs';
import { fingerprint } from './fingerprint.mjs';

const variants = ['before', 'native', 'escape-html', 'fast-escape-html', 'html-escaper'];
const result = { startedAt: new Date().toISOString(), node: process.version, platform: process.platform,
	arch: process.arch, cpu: cpus()[0]?.model, commit: process.env.GITHUB_SHA ?? null,
	baselineCommit: '79c0f63ea166dceabebb79279cb3c560cb3c1fc0', sourceHashes: await fingerprint(),
	protocol: 'Three fresh processes per variant, rotated order; unchanged competitors/worker.mjs and cases.mjs; Buffer.byteLength consumes output.', runs: [] };
for (let round = 0; round < 3; round++) {
	for (let offset = 0; offset < variants.length; offset++) {
		const variant = variants[(round + offset) % variants.length];
		console.log(`micro ${round + 1}/3 ${variant}`);
		const data = JSON.parse(execFileSync(process.execPath, ['--expose-gc', '--import', new URL('./select-before.mjs', import.meta.url).href,
			fileURLToPath(new URL('../competitors/worker.mjs', import.meta.url)), variant === 'before' ? 'native' : variant], {
			encoding: 'utf8', env: { ...process.env, SSG_BEFORE: variant === 'before' ? '1' : '0' },
		}));
		result.runs.push({ ...data, variant, round });
	}
}
result.summary = result.runs[0].measurements.map(({ name }) => ({ name, ...Object.fromEntries(variants.map(variant => {
	const values = result.runs.filter(r => r.variant === variant).map(r => r.measurements.find(m => m.name === name).nsPerCall);
	return [variant, { medianNs: median(values), minNs: Math.min(...values), maxNs: Math.max(...values) }];
})) }));
result.completedAt = new Date().toISOString();
const destination = new URL('../../target/ssg-tuning/results/', import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(new URL('micro.json', destination), JSON.stringify(result, null, 2) + '\n');
