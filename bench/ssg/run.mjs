import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { cpus, platform, arch, release, totalmem } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { hashOutput } from './output.mjs';
import { mergeProfiles } from './profile.mjs';
import { summarize, markdown } from './report.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const site = join(root, 'bench/astro/ssg-site');
const work = join(root, 'target/ssg-work');
const destination = process.env.SSG_OUTPUT ?? join(root, 'target/ssg-results');
const variants = (process.env.SSG_VARIANTS ?? 'native,wasm,escape-html,fast-escape-html,html-escaper').split(',');
const scenarios = (process.env.SSG_SCENARIOS ?? 'articles,catalog,props').split(',');
const workers = (process.env.SSG_WORKER_COUNTS ?? '0,2').split(',').map(Number);
const rounds = Number(process.env.SSG_ROUNDS ?? 5);
const smoke = process.env.SSG_SMOKE === '1';
assert(rounds >= (smoke ? 1 : 3), 'Use at least three independent rounds');
assert(workers.every(n => n === 0 || n === 2));
const pageCounts = { articles: 1000, catalog: 250, props: 64 };
const packageVersion = async path => JSON.parse(await readFile(join(root, path), 'utf8')).version;
let sourceCommit = process.env.GITHUB_SHA;
if (!sourceCommit) {
	try { sourceCommit = execFileSync('git', ['--git-dir=target/native-history.git', '--work-tree=.', 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { sourceCommit = null; }
}
const sourceFiles = ['bench/ssg/run.mjs', 'bench/ssg/adapter.mjs', 'bench/ssg/profile.mjs', 'bench/ssg/integration.mjs',
	'bench/ssg/bootstrap.mjs', 'bench/ssg/output.mjs', 'bench/ssg/report.mjs', 'bench/astro/ssg-site/astro.config.mjs',
	'bench/astro/ssg-site/src/pages/[page].astro', 'bench/astro/ssg-site/src/components/Article.md',
	'bench/astro/package-lock.json', 'bench/competitors/package-lock.json',
	'dist/native.mjs', 'dist/escape-core.mjs', 'dist/wasm.mjs', 'dist/escape_html.wasm'];
for (const file of await readdir(join(root, 'dist/native'))) {
	if (file.endsWith('.node')) sourceFiles.push(`dist/native/${file}`);
}
const sourceHashes = {};
for (const file of sourceFiles) sourceHashes[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex');
const result = { schema: 1, startedAt: new Date().toISOString(), sourceCommit, sourceHashes, smoke,
	environment: { node: process.version, v8: process.versions.v8, platform: platform(), arch: arch(), osRelease: release(),
		cpu: cpus()[0]?.model, logicalCpus: cpus().length, totalMemory: totalmem(),
		libc: process.report?.getReport().header.glibcVersionRuntime ?? null,
		astro: await packageVersion('bench/astro/node_modules/astro/package.json'),
		competitors: Object.fromEntries(await Promise.all(['escape-html', 'fast-escape-html', 'html-escaper'].map(async name => [name, await packageVersion(`bench/competitors/node_modules/${name}/package.json`)]))) },
	protocol: { variants, scenarios, workers, rounds, pageCounts, freshNode: true, cleanAstroCache: true,
		compileCache: false, filesystemCache: 'uncontrolled', installIncluded: false, profilesExcludedFromTiming: true },
	profiles: [], runs: [] };
await mkdir(destination, { recursive: true });
await mkdir(work, { recursive: true });
const expected = new Map();
async function build({ variant, scenario, workerCount, round, profile }) {
	const id = `${scenario}-w${workerCount}-${profile ? 'profile' : `r${round}`}-${variant}`;
	const runDir = join(work, id);
	await rm(runDir, { recursive: true, force: true });
	await mkdir(runDir, { recursive: true });
	await rm(join(site, '.astro'), { recursive: true, force: true });
	const pages = smoke ? 3 : pageCounts[scenario];
	assert(pages > 0, `Unknown scenario: ${scenario}`);
	let log = '';
	const started = performance.now();
	const child = spawn(process.execPath, ['--import', new URL('./bootstrap.mjs', import.meta.url).href,
		join(root, 'bench/astro/node_modules/astro/bin/astro.mjs'), 'build', '--silent'], {
		cwd: site,
		env: { ...process.env, NODE_OPTIONS: '', NODE_DISABLE_COMPILE_CACHE: '1', CI: '1', ASTRO_TELEMETRY_DISABLED: '1',
			SSG_RUN_DIR: runDir, SSG_SCENARIO: scenario, SSG_VARIANT: variant, SSG_PAGES: String(pages),
			SSG_WORKERS: String(workerCount), SSG_PROFILE: profile ? '1' : '0' },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	child.stdout.on('data', data => { log += data; });
	child.stderr.on('data', data => { log += data; });
	const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
	const wallMs = performance.now() - started;
	await writeFile(join(destination, `${id}.log`), log);
	assert.equal(code, 0, `${id} failed:\n${log}`);
	const output = await hashOutput(join(runDir, 'dist'));
	assert.equal(output.htmlFiles, pages, 'Every requested page must be written');
	const firstPage = await readFile(join(runDir, 'dist/page-0/index.html'), 'utf8');
	assert(firstPage.includes('Page 0: HTML &amp; &quot;CSS&quot; &lt;guide&gt;'), 'Escaped title missing');
	if (expected.has(scenario)) assert.deepEqual(output, expected.get(scenario), `${id}: output differs between implementations or worker counts`);
	else expected.set(scenario, output);
	const files = await readdir(runDir);
	const jsons = await Promise.all(files.filter(f => /^(adapter|process|integration).*\.json$/.test(f)).map(async file => [file, JSON.parse(await readFile(join(runDir, file), 'utf8'))]));
	const adapters = jsons.filter(([f]) => f.startsWith('adapter-')).map(([, v]) => v);
	const processes = jsons.filter(([f]) => f.startsWith('process-')).map(([, v]) => v);
	assert(jsons.some(([f, v]) => f === 'integration.json' && v.transforms > 0), 'Replacement not verified');
	assert.equal(adapters.length, workerCount || 1, 'Expected one loaded adapter per rendering thread');
	assert(adapters.every(a => a.variant === variant));
	const main = processes.find(p => p.isMainThread);
	assert(main?.maxRssKiB > 0, 'Missing main-process peak RSS');
	const entry = { id, variant, scenario, workerCount, round, pages, output,
		wallMs: profile ? undefined : wallMs, maxRssMiB: main.maxRssKiB / 1024,
		userCpuMs: main.userCpuMs, systemCpuMs: main.systemCpuMs, adapters, processes };
	if (profile) {
		entry.input = mergeProfiles(adapters.map(a => a.profile));
		assert(entry.input.calls > 0, 'No calls reached the selected implementation');
		result.profiles.push(entry);
	} else result.runs.push(entry);
	await writeFile(join(destination, 'results.json'), JSON.stringify(result, null, 2) + '\n');
	console.log(`${id}: ${profile ? `${entry.input.calls} calls` : `${(wallMs / 1000).toFixed(3)} s, ${entry.maxRssMiB.toFixed(1)} MiB`}`);
	// Retain logs and metrics, but avoid gigabytes of disposable generated HTML.
	await rm(runDir, { recursive: true, force: true });
}
for (const scenario of scenarios) {
	for (const workerCount of workers) {
		// Profiling uses the same fixture in an independent, untimed build.
		await build({ variant: 'native', scenario, workerCount, round: 0, profile: true });
		for (let round = 0; round < rounds; round++) {
			const order = variants.map((_, i) => variants[(i + round) % variants.length]);
			for (const variant of order) await build({ variant, scenario, workerCount, round, profile: false });
		}
	}
}
for (const scenario of scenarios) {
	const profiles = result.profiles.filter(p => p.scenario === scenario);
	for (const profile of profiles) assert.deepEqual(profile.input, profiles[0].input, 'Worker counts must preserve the input distribution');
}
result.completedAt = new Date().toISOString();
result.summary = summarize(result);
await writeFile(join(destination, 'results.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(join(destination, 'README.md'), markdown(result));
console.log(`Saved ${join(destination, 'README.md')}`);
