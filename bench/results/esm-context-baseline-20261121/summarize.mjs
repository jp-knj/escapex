// Regenerate the baseline report from recorded process samples, without timing.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = new URL('./', import.meta.url);
const load = async name => JSON.parse(await readFile(new URL(name, directory), 'utf8'));
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const protocol = await load('protocol.json');
assert(protocol.completedAt, 'All measurements must finish before reporting');
const operations = ['escapeText', 'escapeAttribute', 'escapeHTML'];
const majors = [22, 24, 26];
const results = [];
let hashes;
for (const major of majors) {
  for (const operation of operations) {
    const file = `node${major}-${operation}.json`;
    const result = await load(file);
    assert.equal(result.operation, operation);
    assert.equal(Number(result.environment.node.split('.')[0].slice(1)), major);
    assert.equal(result.sourceCommit, protocol.sourceCommit);
    assert.deepEqual(result.variants, ['esm']);
    assert.equal(result.rounds, 5);
    assert.equal(result.runs.length, 5);
    assert.deepEqual(result.runs.map(run => run.round).sort(), [1, 2, 3, 4, 5]);
    assert.equal(result.summary.length, operation === 'escapeHTML' ? 25 : 28);
    assert.equal(new Set(result.summary.map(row => row.name)).size, result.summary.length);
    if (hashes) assert.deepEqual(result.sha256, hashes, 'Source or build differs between runs');
    else hashes = result.sha256;
    for (const run of result.runs) {
      assert.equal(run.variant, 'esm');
      assert.equal(run.operation, operation);
      assert.equal(run.compatibility.preservesLoneSurrogates, true);
      assert.equal(run.compatibility.identicalEntitySpelling, true);
      assert.equal(run.compatibility.escapesSlash, false);
      assert.deepEqual(run.measurements.map(row => row.name), result.summary.map(row => row.name));
    }
    for (const row of result.summary) {
      const measurements = result.runs.map(run => run.measurements.find(value => value.name === row.name));
      const samples = measurements.map(value => value.nsPerCall);
      assert(samples.every(value => Number.isFinite(value) && value > 0));
      assert.equal(row.nsPerCall.esm, median(samples));
      assert.deepEqual(row.ranges.esm, { min: Math.min(...samples), max: Math.max(...samples) });
      for (const value of measurements) {
        for (const key of ['inputUnits', 'minimumInputUnits', 'inputPoolSize']) assert.equal(value[key], row[key]);
        assert(value.warmIterations >= (value.inputUnits < 256 ? 10000 : 1000));
        assert(value.iterations > 0);
      }
    }
    results.push({ file, major, ...result });
  }
}
for (const file of ['index.mjs', 'escape-core.mjs']) {
  const hash = createHash('sha256').update(await readFile(new URL(`baseline-dist/${file}`, directory))).digest('hex');
  assert.equal(hash, hashes[`dist/${file}`], `Saved baseline artifact differs: ${file}`);
}
const bundles = await load('bundle-sizes.json');
const env = results[0].environment;
for (const result of results) {
  for (const key of ['cpu', 'platform', 'arch', 'os']) assert.equal(result.environment[key], env[key]);
}
const lines = [
  '# ESM context API baseline', '',
  `Source: [${protocol.sourceCommit.slice(0, 7)}](https://github.com/jp-knj/escapex/commit/${protocol.sourceCommit}). No runtime or benchmark implementation changes were made for this measurement.`, '',
  `Host: ${env.cpu}, ${env.platform} ${env.arch}, Darwin ${env.os}.`, '',
  `Measured from ${protocol.startedAt} through ${protocol.completedAt}.`, '',
  'Additional same-output comparisons against published libraries: [COMPETITION.md](./COMPETITION.md).', '',
  '## Protocol', '',
  '- Measure the public default ESM entry. Run escapeText and escapeAttribute over 28 inputs each; retain escapeHTML over 25 inputs as a control for future changes.',
  '- Five fresh processes per API and Node version. Node versions and APIs run sequentially; this task runs no concurrent build or benchmark. Background system load and CPU frequency are uncontrolled.',
  '- For each input, warm up for at least 100 ms and 10,000 calls below 256 UTF-16 units or 1,000 calls otherwise. Explicit GC follows warmup; measure for at least 300 ms.',
  '- Include Buffer.byteLength of every result. Exclude import and initialization time. Validate output against the independent oracle before timing.',
  '- Report the median of five process means, with minimum and maximum. These ranges are not confidence intervals. Input pools rotate within each timed process.',
  '- Record SHA-256 hashes for sources, built ESM files, lockfiles, build configuration and the benchmark harness. Validate identical hashes across all nine datasets.',
  '- Preserve the exact measured ESM files under baseline-dist/ for future before/after measurements.',
  '- API operations escape different character sets; timings across operations do not represent equivalent work. This is a microbenchmark on one Apple M2, not a full-build or cross-platform result.', '',
  '| Node | V8 |', '|---|---|',
  ...majors.map(major => {
    const { environment } = results.find(result => result.major === major);
    return `| ${environment.node} | ${environment.v8} |`;
  }), '',
  'Power-state snapshots, local Node paths, run order and source commit: [protocol.json](./protocol.json).', '',
];
for (const operation of operations) {
  const datasets = majors.map(major => results.find(result => result.major === major && result.operation === operation));
  lines.push(`## ${operation}`, '',
    'Microseconds per call: median (minimum to maximum). Each column contains five independent process samples.', '',
    '| Case | UTF-16 units | Pool | Node 22 | Node 24 | Node 26 |',
    '|---|---:|---:|---:|---:|---:|');
  for (const row of datasets[0].summary) {
    const values = datasets.map(result => {
      const value = result.summary.find(value => value.name === row.name);
      const range = value.ranges.esm;
      return `${(value.nsPerCall.esm / 1000).toFixed(3)} (${(range.min / 1000).toFixed(3)} to ${(range.max / 1000).toFixed(3)})`;
    });
    const units = row.minimumInputUnits === row.inputUnits ? row.inputUnits : `${row.minimumInputUnits} to ${row.inputUnits}`;
    lines.push(`| ${row.name} | ${units} | ${row.inputPoolSize} | ${values.join(' | ')} |`);
  }
  lines.push('', `Raw data: ${datasets.map(result => `[Node ${result.major}](./${result.file})`).join(', ')}.`, '');
}
lines.push('## Individual-export bundle sizes', '',
  `Measured with Node ${bundles.node}, Rolldown ${bundles.versions.rolldown} and Vite ${bundles.versions.vite}; built with tsdown ${bundles.versions.tsdown}.`, '',
  bundles.method, '',
  '| Bundler | Export | Bytes | Gzip bytes |', '|---|---|---:|---:|',
  ...bundles.results.map(row => `| ${row.tool} | ${row.operation} | ${row.bytes} | ${row.gzipBytes} |`), '',
  'The existing gzip limits are 355/365 bytes for Rolldown escapeText/escapeAttribute and 395/405 bytes for Vite. Future optimization should retain those limits.', '',
  'Raw sizes and bundle hashes: [bundle-sizes.json](./bundle-sizes.json).', '',
  '## Validation', '',
  '- Rebuilt JavaScript and both Wasm artifacts from the recorded source commit: [build.log](./build.log).',
  '- All 29 ESM, Wasm, package/bundler, documentation and benchmark tests passed before measurements: [verification.log](./verification.log).',
  '- Benchmark workers checked each corpus input against the independent oracle before timing.',
  '- This report generator verifies all process samples, medians, ranges, source hashes and the saved ESM artifact hashes.', '',
  '## Reproduce', '',
  'Use a checkout of the source commit above and install root dependencies with npm ci. Build with npm run build:js using Node 24.22.2. For every Node version in the table, run the following sequentially, setting NODE_BIN to that exact Node executable and RESULT_DIR to a new output directory:', '',
  '```sh',
  'for operation in escapeText escapeAttribute escapeHTML; do',
  '  NODE_OPTIONS= BENCH_VARIANTS=esm BENCH_ROUNDS=5 \\',
  '    BENCH_OPERATION="$operation" BENCH_SOURCE_COMMIT="$(git rev-parse HEAD)" \\',
  '    BENCH_OUTPUT="$RESULT_DIR/$operation.json" \\',
  '    "$NODE_BIN" bench/competitors/run.mjs',
  'done',
  '```', '',
  'Set a different RESULT_DIR for each Node version. Competitor packages and native artifacts are not required for these ESM-only timings. Build both Wasm artifacts with npm run build before rerunning the package verification.', '',
  'Reproduce individual-export bundle sizes with Node 24.22.2 after npm run build, and before starting any timed measurements:', '',
  '```sh', 'node bench/results/esm-context-baseline-20261121/measure-bundles.mjs', '```', '',
  'Regenerate this report from the recorded data without rerunning measurements:', '',
  '```sh', 'node bench/results/esm-context-baseline-20261121/summarize.mjs', '```', '',
  'When assessing an optimization, remeasure the saved baseline and the candidate on the same host and runtime in alternating order. A comparison against this earlier run alone cannot separate code effects from changes in system load.', '',
);
await writeFile(new URL('README.md', directory), lines.join('\n'));
console.log(`Verified ${results.length} datasets, ${results.reduce((count, result) => count + result.runs.length, 0)} process samples and saved ESM artifacts.`);
