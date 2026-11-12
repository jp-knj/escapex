import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { median } from '../stats.mjs';
import { cases } from '../native-selection/cases.mjs';

assert.equal(process.versions.node.split('.')[0], '24', 'Performance acceptance uses Node 24');
const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = resolve(root, process.env.HTML_BUFFER_OUTPUT ?? 'target/rust-buffers/html-only-results/local.json');
await mkdir(dirname(destination), { recursive: true });
const variants = ['before', 'html-only'];
const manifest = JSON.parse(await readFile(resolve(root, 'target/rust-buffers/html-only-manifest.json')));
const hash = async path => createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');
// Fail if any variant or its addon changed after preparation.
for (const variant of variants) {
	assert.equal(await hash(`target/rust-buffers/${variant}/dist/native.mjs`), manifest.variants[variant].api);
	assert.equal(await hash(`target/rust-buffers/${variant}/dist/native/${manifest.variants[variant].binary}`), manifest.variants[variant].addon);
	assert.equal(manifest.variants[variant].api, manifest.variants.before.api);
}
const files = ['bench/rust-buffers/html-only-bindings.rs', 'bench/rust-buffers/html-only-prepare.mjs', 'bench/rust-buffers/html-only-run.mjs', 'bench/rust-buffers/html-only-context-run.mjs', 'bench/rust-buffers/before/native_escape.rs', 'bench/rust-buffers/before/napi_bindings.rs',
 'bench/rust-buffers/variants.mjs', 'bench/rust-buffers/native_buffer.rs', 'bench/rust-buffers/napi_bindings.rs',
 'bench/rust-buffers/prepare.mjs', 'bench/rust-buffers/run.mjs', 'bench/rust-buffers/lifetime.test.mjs',
 'bench/native-selection/select.mjs', 'bench/native-selection/cases.mjs', 'bench/competitors/worker.mjs',
 'bench/competitors/cases.mjs', 'src/native.ts', 'src/escape.ts', 'src/rust/Cargo.lock', 'package-lock.json'];
const result = { startedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform,
	arch: process.arch, os: release(), cpu: cpus()[0]?.model, target: process.env.NATIVE_PLATFORM },
	commit: process.env.GITHUB_SHA ?? null, manifest, hashes: Object.fromEntries(await Promise.all(files.map(async file => [file, await hash(file)]))),
	protocol: 'Unmodified competitor worker; fresh process per variant/round; rotated order; at least 100ms warmup and 10000 short or 1000 long calls; at least 300ms per case; Buffer.byteLength consumes output. Five initial rounds; if any case exceeds +5%, five additional rounds with the same cases and order rotation for baseline and affected candidates. All samples retained.',
	runs: [] };
async function save() { await writeFile(destination, JSON.stringify(result, null, 2) + '\n'); }
async function measure(round, active) {
	for (let offset = 0; offset < active.length; offset++) {
		const variant = active[(round + offset) % active.length];
		console.log(`Rust buffer round ${round + 1}: ${variant}`);
		const data = JSON.parse(execFileSync(process.execPath, ['--expose-gc', '--import', new URL('../native-selection/select.mjs', import.meta.url).href,
			fileURLToPath(new URL('../competitors/worker.mjs', import.meta.url)), 'native'], {
			encoding: 'utf8', env: { ...process.env, SELECTION_API: resolve(root, `target/rust-buffers/${variant}/dist/native.mjs`) },
		}));
		assert.deepEqual(data.measurements.map(row => row.name), Object.keys(cases));
		result.runs.push({ ...data, variant, round });
		await save();
	}
}
function summary(variant, rounds) {
	const rows = Object.keys(cases).map(name => {
		const samples = key => result.runs.filter(run => run.variant === key && run.round < rounds)
			.map(run => run.measurements.find(row => row.name === name).nsPerCall);
		const before = samples('before'), after = samples(variant);
		assert.equal(before.length, rounds);
		assert.equal(after.length, rounds);
		return { name, before, after, beforeMedian: median(before), afterMedian: median(after), change: median(after) / median(before) - 1 };
	});
	const regressions = rows.filter(row => row.change > 0.05).map(row => row.name);
	return { rounds, rows, regressions, passes: regressions.length === 0 };
}
for (let round = 0; round < 5; round++) await measure(round, variants);
result.initial = Object.fromEntries(variants.slice(1).map(variant => [variant, summary(variant, 5)]));
const retry = variants.slice(1).filter(variant => result.initial[variant].regressions.length);
await save();
if (retry.length) for (let round = 5; round < 10; round++) await measure(round, ['before', ...retry]);
result.final = Object.fromEntries(variants.slice(1).map(variant => [variant, summary(variant, retry.includes(variant) ? 10 : 5)]));
result.completedAt = new Date().toISOString();
await save();
console.log(JSON.stringify({ candidates: Object.fromEntries(Object.entries(result.final).map(([name, data]) =>
	[name, { rounds: data.rounds, regressions: data.regressions, passes: data.passes }])) }, null, 2));
