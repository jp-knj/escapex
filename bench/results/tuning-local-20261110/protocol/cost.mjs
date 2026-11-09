import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { hashOutput } from './output.mjs';
import { createProfile, recordInput } from './profile.mjs';
import { median } from '../stats.mjs';
import { fingerprint } from './fingerprint.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const site = join(root, 'bench/astro/ssg-site');
const work = join(root, 'target/ssg-tuning');
const variants = (process.env.COST_VARIANTS ?? 'before,native,wasm,escape-html,fast-escape-html,html-escaper').split(',');
const rounds = Number(process.env.COST_ROUNDS ?? 5);
assert(rounds >= 3);
const baseline = JSON.parse(await readFile(join(root, 'bench/results/ssg-local-20261110/results.json')));
async function execute(args, options) {
	const child = spawn(process.execPath, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
	let out = '', err = '';
	child.stdout.on('data', data => { out += data; });
	child.stderr.on('data', data => { err += data; });
	const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
	assert.equal(code, 0, `${out}\n${err}`);
	return out;
}
await mkdir(work, { recursive: true });
const result = { startedAt: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model,
	platform: process.platform, arch: process.arch, commit: process.env.GITHUB_SHA ?? null,
	baselineCommit: '79c0f63ea166dceabebb79279cb3c560cb3c1fc0', sourceHashes: await fingerprint(),
	protocol: 'Warm replay of actual SSG inputs, including Buffer.byteLength; not a full-build speedup or strict upper bound.',
	rounds, variants, inputs: [], runs: [], summary: [] };
for (const profile of baseline.profiles.filter(p => p.workerCount === 0)) {
	const { scenario, pages } = profile;
	const file = join(work, `${scenario}-inputs.json`);
	if (process.env.COST_REUSE_INPUTS !== '1') {
		const runDir = join(work, `capture-${scenario}`);
		await rm(runDir, { recursive: true, force: true });
		await mkdir(runDir, { recursive: true });
		await rm(join(site, '.astro'), { recursive: true, force: true });
		await execute(['--import', new URL('./capture-inputs.mjs', import.meta.url).href,
			join(root, 'bench/astro/node_modules/astro/bin/astro.mjs'), 'build', '--silent'], {
			cwd: site, env: { ...process.env, NODE_OPTIONS: '', NODE_DISABLE_COMPILE_CACHE: '1', CI: '1',
				ASTRO_TELEMETRY_DISABLED: '1', SSG_RUN_DIR: runDir, SSG_SCENARIO: scenario, SSG_VARIANT: 'native',
				SSG_PAGES: String(pages), SSG_WORKERS: '0', SSG_PROFILE: '0', SSG_CAPTURE_FILE: file },
		});
		const capturedOutput = await hashOutput(join(runDir, 'dist'));
		assert.equal(capturedOutput.htmlFiles, pages);
		// Compare on this OS: Markdown line endings can differ between checkouts.
		await rm(join(runDir, 'dist'), { recursive: true, force: true });
		await execute([join(root, 'bench/astro/node_modules/astro/bin/astro.mjs'), 'build', '--silent'], {
			cwd: site, env: { ...process.env, NODE_OPTIONS: '', NODE_DISABLE_COMPILE_CACHE: '1', CI: '1',
				ASTRO_TELEMETRY_DISABLED: '1', SSG_RUN_DIR: runDir, SSG_SCENARIO: scenario, SSG_VARIANT: 'escape-html',
				SSG_PAGES: String(pages), SSG_WORKERS: '0', SSG_PROFILE: '0' },
		});
		assert.deepEqual(await hashOutput(join(runDir, 'dist')), capturedOutput);
		await rm(runDir, { recursive: true, force: true });
	}
	const bytes = await readFile(file);
	const inputs = JSON.parse(bytes);
	const actual = createProfile();
	for (const input of inputs) recordInput(actual, input);
	assert.deepEqual(actual, profile.input);
	result.inputs.push({ scenario, pages, sha256: createHash('sha256').update(bytes).digest('hex'), profile: actual });
	for (let round = 0; round < rounds; round++) {
		for (let i = 0; i < variants.length; i++) {
			const variant = variants[(i + round) % variants.length];
			const data = JSON.parse(await execute(['--expose-gc', fileURLToPath(new URL('./cost-worker.mjs', import.meta.url)), variant, file], { cwd: root }));
			result.runs.push({ scenario, round, ...data });
		}
	}
	for (const variant of variants) {
		const values = result.runs.filter(r => r.scenario === scenario && r.variant === variant).map(r => r.msPerCorpus);
		result.summary.push({ scenario, variant, medianMs: median(values), minMs: Math.min(...values), maxMs: Math.max(...values) });
	}
	console.log(scenario, result.summary.filter(s => s.scenario === scenario));
}
result.completedAt = new Date().toISOString();
await writeFile(process.env.COST_OUTPUT ?? join(work, 'cost.json'), JSON.stringify(result, null, 2) + '\n');
