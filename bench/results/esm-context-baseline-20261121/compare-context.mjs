// Compare only corpus inputs with byte-identical outputs. APIs are not equivalent
// for all strings; record every excluded corpus case and single-unit difference.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { casesFor } from '../../competitors/cases.mjs';
import { reference } from '../../competitors/suite.mjs';
import { median } from '../../stats.mjs';
import * as esm from './baseline-dist/index.mjs';
import * as entities from './competitor-packages/node_modules/entities/dist/escape.js';

const operation = process.argv[2];
assert(['escapeText', 'escapeAttribute'].includes(operation));
const variants = ['esm', 'entities'];
const implementations = { esm: esm[operation], entities: entities[operation] };
const included = [];
const excluded = [];
for (const [name, value] of Object.entries(casesFor(operation))) {
  const inputs = Array.isArray(value) ? value : [value];
  const expected = inputs.map(input => reference(operation, input));
  for (let index = 0; index < inputs.length; index++) assert.equal(implementations.esm(inputs[index]), expected[index]);
  const mismatches = inputs.filter((input, index) => implementations.entities(input) !== expected[index]);
  if (mismatches.length) excluded.push({ name, inputs: inputs.length, mismatches: mismatches.length });
  else included.push({ name, value, inputs });
}
assert(included.length > 0);

if (process.argv[3] === '--worker') {
  const variant = process.argv[4];
  assert(variants.includes(variant));
  const fn = implementations[variant];
  let checksum = 0;
  const measurements = [];
  for (const { name, value, inputs } of included) {
    const inputUnits = Math.max(...inputs.map(input => input.length));
    const batch = Math.max(1, Math.min(256, Math.ceil(65536 / inputUnits)));
    let cursor = 0;
    const consume = inputs.length === 1
      ? () => { for (let index = 0; index < batch; index++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0; }
      : () => {
        for (let index = 0; index < batch; index++) {
          checksum = (checksum + Buffer.byteLength(fn(inputs[cursor]))) >>> 0;
          if (++cursor === inputs.length) cursor = 0;
        }
      };
    const warm = performance.now();
    let warmIterations = 0;
    const minimumWarmup = inputUnits < 256 ? 10000 : 1000;
    do { consume(); warmIterations += batch; } while (performance.now() - warm < 100 || warmIterations < minimumWarmup);
    global.gc?.();
    let iterations = 0;
    const start = performance.now();
    do { consume(); iterations += batch; } while (performance.now() - start < 300);
    measurements.push({ name, operation, inputUnits, minimumInputUnits: Math.min(...inputs.map(input => input.length)),
      inputPoolSize: inputs.length, outputUnits: Math.max(...inputs.map(input => fn(input).length)),
      nsPerCall: (performance.now() - start) * 1e6 / iterations, warmIterations, iterations });
  }
  console.log(JSON.stringify({ variant, operation, measurements, checksum }));
} else {
  const startedAt = new Date().toISOString();
  const rounds = 6; // Balance both implementation orders three times each.
  const files = ['compare-context.mjs', 'baseline-dist/index.mjs', 'baseline-dist/escape-core.mjs',
    '../../competitors/cases.mjs', '../../competitors/suite.mjs', '../../stats.mjs',
    'competitor-packages/package.json', 'competitor-packages/package-lock.json',
    'competitor-packages/node_modules/entities/package.json', 'competitor-packages/node_modules/entities/dist/escape.js'];
  const fingerprints = async () => Object.fromEntries(await Promise.all(files.map(async file =>
    [file, createHash('sha256').update(await readFile(new URL(file, import.meta.url))).digest('hex')])));
  const sha256 = await fingerprints();
  const differences = [];
  for (let code = 0; code <= 0xffff; code++) {
    const input = String.fromCharCode(code);
    const expected = implementations.esm(input);
    const actual = implementations.entities(input);
    if (actual !== expected) differences.push({ codeUnit: code, escapex: expected, entities: actual });
  }
  assert.deepEqual(differences.map(value => value.codeUnit), operation === 'escapeText' ? [160] : [10, 13, 39, 160]);
  const runs = [];
  for (let round = 1; round <= rounds; round++) {
    const order = round % 2 ? variants : [...variants].reverse();
    for (const variant of order) {
      console.error(`contexts ${operation} ${round}/${rounds} ${variant}`);
      const run = JSON.parse(execFileSync(process.execPath,
        ['--expose-gc', fileURLToPath(import.meta.url), operation, '--worker', variant], { encoding: 'utf8' }));
      runs.push({ round, ...run });
    }
  }
  const summary = included.map(({ name }) => {
    const samples = Object.fromEntries(variants.map(variant => [variant, runs.filter(run => run.variant === variant)
      .map(run => run.measurements.find(row => row.name === name).nsPerCall)]));
    const pairedRatios = Array.from({ length: rounds }, (_, index) => {
      const sample = variant => runs.find(run => run.round === index + 1 && run.variant === variant)
        .measurements.find(row => row.name === name).nsPerCall;
      return sample('esm') / sample('entities');
    });
    return { name, nsPerCall: Object.fromEntries(variants.map(variant => [variant, median(samples[variant])])),
      ranges: Object.fromEntries(variants.map(variant => [variant, { min: Math.min(...samples[variant]), max: Math.max(...samples[variant]) }])),
      pairedEsmOverEntities: { samples: pairedRatios, median: median(pairedRatios) } };
  });
  assert.deepEqual(await fingerprints(), sha256);
  const protocol = JSON.parse(await readFile(new URL('protocol.json', import.meta.url)));
  const version = JSON.parse(await readFile(new URL('competitor-packages/node_modules/entities/package.json', import.meta.url))).version;
  assert.equal(version, '9.0.0');
  const result = { operation, variants, rounds, sourceCommit: protocol.sourceCommit, startedAt, completedAt: new Date().toISOString(),
    environment: { node: process.version, v8: process.versions.v8, cpu: cpus()[0]?.model, platform: process.platform, arch: process.arch, os: release() },
    versions: { entities: version }, included: included.map(row => row.name), excluded, singleUnitDifferences: differences,
    method: 'Exact-output intersection of the existing 28-case context corpus. Six fresh processes per implementation, alternating order; >=100ms warmup and >=10000/1000 calls, >=300ms timing; Buffer.byteLength consumes each output. No adaptation or normalization inside the timer. API contracts differ outside this subset. Ratios pair adjacent processes within each round; ranges are not confidence intervals.',
    sha256, runs, summary };
  const output = new URL(`node${process.versions.node.split('.')[0]}-entities-${operation}.json`, import.meta.url);
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`Completed ${operation}: ${included.length} matched cases, ${excluded.length} excluded cases.`);
}
