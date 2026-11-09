// Paired full-build measurement of the kernel change. Existing fixtures,
// integration, adapters and output hashing are reused without modifications.
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { hashOutput } from './output.mjs';
import { fingerprint } from './fingerprint.mjs';
import { median } from '../stats.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const site = join(root, 'bench/astro/ssg-site');
const destination = process.env.TUNING_OUTPUT ?? join(root, 'target/ssg-tuning/results');
const work = join(root, 'target/ssg-tuning/build-work');
const variants = ['before', 'native', 'escape-html', 'fast-escape-html', 'html-escaper'];
const rounds = Number(process.env.TUNING_ROUNDS ?? 5);
assert(Number.isInteger(rounds) && rounds >= 3);
const result = { startedAt: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model,
	platform: process.platform, arch: process.arch, commit: process.env.GITHUB_SHA ?? null,
	baselineCommit: '79c0f63ea166dceabebb79279cb3c560cb3c1fc0', sourceHashes: await fingerprint(),
	protocol: { rounds, variants, workers: 0, freshNode: true, rotatedOrder: true, cleanAstroCache: true,
		compileCache: false, filesystemCache: 'uncontrolled', includes: 'spawn through exit, import, compile, render and file writes',
		excludes: 'dependency installation, correctness checks and output hashing' }, runs: [], summary: [] };
await mkdir(destination, { recursive: true });
for (const [scenario, pages] of Object.entries({ articles: 1000, catalog: 250, props: 64 })) {
	let expected;
	for (let round = 0; round < rounds; round++) {
		for (let offset = 0; offset < variants.length; offset++) {
			const variant = variants[(round + offset) % variants.length];
			const id = `${scenario}-r${round}-${variant}`;
			await rm(work, { recursive: true, force: true });
			await mkdir(work, { recursive: true });
			await rm(join(site, '.astro'), { recursive: true, force: true });
			let log = '';
			const started = performance.now();
			const child = spawn(process.execPath, ['--import', new URL('./select-before.mjs', import.meta.url).href,
				'--import', new URL('./bootstrap.mjs', import.meta.url).href,
				join(root, 'bench/astro/node_modules/astro/bin/astro.mjs'), 'build', '--silent'], {
				cwd: site, env: { ...process.env, NODE_OPTIONS: '', NODE_DISABLE_COMPILE_CACHE: '1', CI: '1',
					ASTRO_TELEMETRY_DISABLED: '1', SSG_RUN_DIR: work, SSG_SCENARIO: scenario,
					SSG_VARIANT: variant === 'before' ? 'native' : variant, SSG_BEFORE: variant === 'before' ? '1' : '0',
					SSG_PAGES: String(pages), SSG_WORKERS: '0', SSG_PROFILE: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
			});
			child.stdout.on('data', data => { log += data; });
			child.stderr.on('data', data => { log += data; });
			const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
			const wallMs = performance.now() - started;
			await writeFile(join(destination, `${id}.log`), log);
			assert.equal(code, 0, `${id}: ${log}`);
			const output = await hashOutput(join(work, 'dist'));
			assert.equal(output.htmlFiles, pages);
			if (expected) assert.deepEqual(output, expected, id);
			else expected = output;
			const firstPage = await readFile(join(work, 'dist/page-0/index.html'), 'utf8');
			assert(firstPage.includes('Page 0: HTML &amp; &quot;CSS&quot; &lt;guide&gt;'));
			const files = await readdir(work);
			const jsons = await Promise.all(files.filter(f => /^(adapter|process|integration).*\.json$/.test(f))
				.map(async f => [f, JSON.parse(await readFile(join(work, f), 'utf8'))]));
			assert(jsons.some(([f, value]) => f === 'integration.json' && value.transforms > 0));
			const adapters = jsons.filter(([f]) => f.startsWith('adapter-')).map(([, v]) => v);
			assert.equal(adapters.length, 1);
			assert.equal(adapters[0].variant, variant === 'before' ? 'native' : variant);
			if (variant === 'before' || variant === 'native') {
				const selection = JSON.parse(await readFile(join(work, 'selection.json'), 'utf8'));
				assert.equal(selection.url, new URL(variant === 'before' ? '../../target/ssg-tuning/before-api/native.mjs' : '../../dist/native.mjs', import.meta.url).href);
			}
			const main = jsons.find(([f, v]) => f.startsWith('process-') && v.isMainThread)?.[1];
			assert(main?.maxRssKiB > 0);
			result.runs.push({ scenario, pages, variant, round, wallMs, output, maxRssMiB: main.maxRssKiB / 1024,
				loadMs: adapters[0].loadMs, userCpuMs: main.userCpuMs, systemCpuMs: main.systemCpuMs });
			await writeFile(join(destination, 'ssg.json'), JSON.stringify(result, null, 2) + '\n');
			console.log(`${id}: ${wallMs.toFixed(3)} ms`);
		}
	}
	for (const variant of variants) {
		const rows = result.runs.filter(r => r.scenario === scenario && r.variant === variant);
		result.summary.push({ scenario, variant, medianMs: median(rows.map(r => r.wallMs)),
			minMs: Math.min(...rows.map(r => r.wallMs)), maxMs: Math.max(...rows.map(r => r.wallMs)),
			medianRssMiB: median(rows.map(r => r.maxRssMiB)), medianLoadMs: median(rows.map(r => r.loadMs)) });
	}
}
await rm(work, { recursive: true, force: true });
result.completedAt = new Date().toISOString();
await writeFile(join(destination, 'ssg.json'), JSON.stringify(result, null, 2) + '\n');
console.table(result.summary);
