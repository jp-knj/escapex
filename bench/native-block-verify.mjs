import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { targets } from '../scripts/native-targets.mjs';

if (process.platform !== 'win32') {
 console.log('Windows-only benchmark retry: no timed work on this runner.');
 process.exit(0);
}

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'target/native-block-verify');
const target = targets.find(value => value.id === process.env.NATIVE_PLATFORM);
assert(target, process.env.NATIVE_PLATFORM);
const hash = value => createHash('sha256').update(value).digest('hex');
const proposed = (await readFile(join(root, 'src/rust/src/native_escape.rs'), 'utf8')).replaceAll('\r\n', '\n');
const start = proposed.indexOf('#[inline(always)]\nfn scan<const LANES:');
const end = proposed.indexOf('#[inline(always)]\nfn scan_inner<', start);
assert(start > 0 && end > start);
let before = proposed.slice(0, start) + proposed.slice(end);
before = before.replace('fn scan_inner<const LANES: usize, const STRIDE: u32, const BATCH: bool>(',
 'fn scan<const LANES: usize, const STRIDE: u32>(')
 .replace('fn append_match<const RESERVED: bool>(', 'fn append_match(')
 .replace('    if !RESERVED {\n        output.reserve(input.len() - *last + 7);\n    }', '    output.reserve(input.len() - *last + 7);')
 .replace('append_match::<false>(', 'append_match(')
 .replace('append_match::<BATCH>(', 'append_match(')
 .replace('        if BATCH && matches != 0 {\n            // Each lane adds at most five units. Reserve the unchanged suffix,\n            // all growth in this vector, and padding for the final entity store.\n            output.reserve(input.len() - last + 5 * LANES + 7);\n        }\n', '');
assert.equal(hash(before), 'e8339888bd64b5e9241faba320472a086014a5743723e75d6b9dd5a5b43c0f67');
const flags = target.libc === 'musl' ? '-C target-feature=-crt-static' : '';
const env = { ...process.env, RUSTFLAGS: flags, CARGO_ENCODED_RUSTFLAGS: flags ? '-C\x1ftarget-feature=-crt-static' : '' };
const provenance = { baselineImplementationCommit: 'eda293bec2bc54e9e77c3d206bebb586bb635087',
 currentMain: '93c7511b8c6901d976a7ad89f50c0d45c48d9fe7', commit: process.env.GITHUB_SHA,
 target, node: process.version, rustc: execFileSync('rustc', ['-V'], { encoding: 'utf8' }).trim(), variants: {} };
for (const [variant, source] of Object.entries({ before, proposed })) {
 const dir = join(output, variant);
 await mkdir(join(dir, 'rust/src'), { recursive: true });
 await cp(join(root, 'src/rust/src'), join(dir, 'rust/src'), { recursive: true });
 for (const name of ['Cargo.toml', 'Cargo.lock', 'build.rs']) await cp(join(root, 'src/rust', name), join(dir, 'rust', name));
 await writeFile(join(dir, 'rust/src/native_escape.rs'), source);
 // Separate target directories avoid stale root-crate artifacts across manifests.
 const build = join(dir, 'build');
 execFileSync('cargo', ['build', '--manifest-path', join(dir, 'rust/Cargo.toml'), '--release', '--offline', '--locked',
  '--features', 'native', '--target', target.triple, '--target-dir', build], { cwd: root, env, stdio: 'inherit' });
 const library = target.os === 'win32' ? 'escape_html_wasm.dll' : `libescape_html_wasm.${target.os === 'darwin' ? 'dylib' : 'so'}`;
 const addon = join(dir, 'dist/native', `escape_html.${target.id}.node`);
 await mkdir(join(dir, 'dist/native'), { recursive: true });
 for (const name of ['native.mjs', 'escape-core.mjs']) await cp(join(root, 'dist', name), join(dir, 'dist', name));
 await cp(join(build, target.triple, 'release', library), addon);
 provenance.variants[variant] = { source: hash(source), addon: hash(await readFile(addon)),
  api: hash(await readFile(join(dir, 'dist/native.mjs'))) };
}
assert.equal(provenance.variants.before.api, provenance.variants.proposed.api);
const records = [];
const median = values => { const sorted = [...values].sort((a,b)=>a-b); const n = sorted.length; return (sorted[Math.floor((n-1)/2)] + sorted[Math.floor(n/2)]) / 2; };
let summary;
const evaluations = [];
for (let round = 1; round <= 10; round++) {
 for (const variant of round % 2 ? ['before', 'proposed'] : ['proposed', 'before']) {
  for (const [suite, worker, args] of [
   ['html', 'bench/competitors/worker.mjs', ['native']],
   ['contexts', 'bench/native-block-verify/context-worker.mjs', []],
  ]) {
   const data = JSON.parse(execFileSync(process.execPath, ['--expose-gc', '--import', pathToFileURL(join(root, 'bench/native-block-verify/select.mjs')).href, join(root, worker), ...args],
    { cwd: root, env: { ...process.env, SCAN_API: join(output, variant, 'dist/native.mjs') }, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
   records.push({ ...data, variant, suite, round });
   console.log(`${round} ${variant} ${suite}: ${data.measurements.length} cases`);
  }
 }
 if (round === 5 || round === 10) {
  const names = [...new Set(records.flatMap(row => row.measurements.map(value => value.name)))];
  summary = names.map(name => {
   const samples = variant => records.filter(row=>row.variant===variant).flatMap(row=>row.measurements.filter(value=>value.name===name).map(value=>value.nsPerCall));
   const baseline = median(samples('before')); const candidate = median(samples('proposed'));
   return { name, before: baseline, proposed: candidate, changePercent: 100 * (candidate / baseline - 1), samples: samples('before').length };
  });
  const regressions = summary.filter(row => row.changePercent > 5);
  evaluations.push({ round, summary });
  console.log('REGRESSIONS', JSON.stringify(regressions));
  if (round === 5 && regressions.length === 0) break;
 }
}
const payload = JSON.stringify({ provenance, records, evaluations, summary });
await mkdir(join(root, 'target/bench-results'), { recursive: true });
await writeFile(join(root, 'target/bench-results', `native-block-${target.id}.json`), payload + '\n');
const encoded = gzipSync(payload, { level: 9 }).toString('base64');
console.log(`BLOCK_SHA256:${hash(payload)}`);
for (let offset = 0; offset < encoded.length; offset += 12000) console.log(`BLOCK_B64:${encoded.slice(offset, offset + 12000)}`);
