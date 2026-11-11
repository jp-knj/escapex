// API-only before/after comparison using the existing competitor fixtures.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { median } from '../stats.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const apis = JSON.parse(process.env.LIBRARY_APIS ?? '{"before":"target/library-tuning/before-api/native.mjs","native":"dist/native.mjs"}');
const variants = (process.env.LIBRARY_VARIANTS ?? 'before,native,escape-html,fast-escape-html,html-escaper').split(',');
const rounds = Number(process.env.LIBRARY_ROUNDS ?? 5);
assert(Number.isInteger(rounds) && rounds >= 3);
const sourceHashes = {};
async function hash(file) { return createHash('sha256').update(await readFile(file)).digest('hex'); }
for (const [variant, path] of Object.entries(apis)) {
	const api = resolve(root, path), folder = dirname(api);
	sourceHashes[variant] = { api: await hash(api), core: await hash(join(folder, 'escape-core.mjs')), binaries: {} };
	for (const file of await readdir(join(folder, 'native'))) {
		if (file.endsWith('.node')) sourceHashes[variant].binaries[file] = await hash(join(folder, 'native', file));
	}
}
const protocolHashes = {};
for (const path of ['bench/library/run.mjs', 'bench/library/select.mjs', 'bench/library/prepare-before.mjs', 'bench/library/esm.mjs', 'bench/competitors/worker.mjs', 'bench/competitors/cases.mjs', 'bench/competitors/package-lock.json']) protocolHashes[path] = await hash(join(root, path));
const implementationHashes = {};
for (const path of ['src/native.ts', 'src/escape-html.ts', 'src/unescape-html.ts', 'rust/src/native.rs', 'rust/src/native_escape.rs', 'rust/Cargo.toml', 'rust/Cargo.lock']) implementationHashes[path] = await hash(join(root, path));
let baseline;
const beforeApi = apis.before ?? apis['esm-before'];
if (beforeApi) {
	try { baseline = JSON.parse(await readFile(join(dirname(resolve(root, beforeApi)), 'source.json'), 'utf8')); }
	catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const result = { startedAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
	cpu: cpus()[0]?.model, commit: process.env.GITHUB_SHA ?? null, sourceHashes, protocolHashes, implementationHashes,
	baseline, apis, variants, rounds,
	protocol: 'Fresh process per variant/round; rotated order; unchanged competitor worker and 25 cases; output consumed with Buffer.byteLength; initialization excluded.', runs: [] };
for (let round = 0; round < rounds; round++) {
	for (let offset = 0; offset < variants.length; offset++) {
		const variant = variants[(round + offset) % variants.length];
		console.log(`library ${round + 1}/${rounds} ${variant}`);
		const data = JSON.parse(execFileSync(process.execPath, ['--expose-gc', '--import', new URL('./select.mjs', import.meta.url).href,
			fileURLToPath(new URL('../competitors/worker.mjs', import.meta.url)), apis[variant] ? 'native' : variant], {
			encoding: 'utf8', env: { ...process.env, LIBRARY_API: apis[variant] ? resolve(root, apis[variant]) : '' },
		}));
		result.runs.push({ ...data, variant, round });
	}
}
result.summary = result.runs[0].measurements.map(({ name }) => ({ name, ...Object.fromEntries(variants.map(variant => {
	const values = result.runs.filter(r => r.variant === variant).map(r => r.measurements.find(m => m.name === name).nsPerCall);
	return [variant, { medianNs: median(values), minNs: Math.min(...values), maxNs: Math.max(...values) }];
})) }));
result.completedAt = new Date().toISOString();
const destination = resolve(root, process.env.LIBRARY_OUTPUT ?? 'target/library-tuning/results/api.json');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(result, null, 2) + '\n');
