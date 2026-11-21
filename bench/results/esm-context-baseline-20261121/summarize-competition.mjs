import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { median } from '../../stats.mjs';

const load = async name => JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
const html = await load('node24-competitors-escapeHTML.json');
const contexts = await Promise.all(['escapeText', 'escapeAttribute'].map(operation => load(`node24-entities-${operation}.json`)));
const datasets = [html, ...contexts];
for (const result of datasets) {
  assert.equal(result.environment.node, 'v24.22.2');
  assert.equal(result.runs.length, result.rounds * result.variants.length);
  for (const variant of result.variants) {
    const runs = result.runs.filter(run => run.variant === variant);
    assert.equal(new Set(runs.map(run => run.round)).size, result.rounds);
    for (const row of result.summary) {
      const samples = runs.map(run => run.measurements.find(value => value.name === row.name).nsPerCall);
      assert(samples.every(value => Number.isFinite(value) && value > 0));
      assert.equal(row.nsPerCall[variant], median(samples));
      assert.deepEqual(row.ranges[variant], { min: Math.min(...samples), max: Math.max(...samples) });
    }
  }
  if (result.operation !== 'escapeHTML') {
    assert.equal(result.sha256['baseline-dist/index.mjs'], html.sha256['dist/index.mjs']);
    assert.equal(result.sha256['baseline-dist/escape-core.mjs'], html.sha256['dist/escape-core.mjs']);
    assert.equal(result.included.length + result.excluded.length, 28);
    for (const row of result.summary) {
      const samples = Array.from({ length: result.rounds }, (_, index) => {
        const value = variant => result.runs.find(run => run.variant === variant && run.round === index + 1)
          .measurements.find(value => value.name === row.name).nsPerCall;
        return value('esm') / value('entities');
      });
      assert.deepEqual(row.pairedEsmOverEntities.samples, samples);
      assert.equal(row.pairedEsmOverEntities.median, median(samples));
    }
  }
}
const facts = datasets.map(result => ({ operation: result.operation, cases: result.summary.length,
  lowerEsmMedians: result.summary.filter(row => row.nsPerCall.esm < Math.min(...result.variants.filter(v => v !== 'esm').map(v => row.nsPerCall[v]))).length,
  largestGaps: result.summary.map(row => {
    const others = result.variants.filter(value => value !== 'esm');
    const best = others.reduce((a, b) => row.nsPerCall[a] < row.nsPerCall[b] ? a : b);
    return { name: row.name, esmUs: row.nsPerCall.esm / 1000, competitor: best, competitorUs: row.nsPerCall[best] / 1000,
      esmOverCompetitor: row.nsPerCall.esm / row.nsPerCall[best], overlappingRanges: row.ranges.esm.max >= row.ranges[best].min && row.ranges[best].max >= row.ranges.esm.min };
  }).sort((a, b) => b.esmOverCompetitor - a.esmOverCompetitor),
}));
const env = html.environment;
const lines = ['# Competitor baseline', '',
  `Source: ${html.sourceCommit}. Host: ${env.cpu}, ${env.platform} ${env.arch}, Node ${env.node}, V8 ${env.v8}.`, '',
  'This is a baseline before optimization. It does not establish universal fastest status. Medians rank only the measured corpus on this host and runtime; close or overlapping ranges need more paired evidence.', '',
  '## Comparison rules', '',
  '- Keep all existing input cases. Measure every implementation in fresh processes, with balanced execution order. Include Buffer.byteLength of each output, excluding imports and initialization.',
  '- HTML: escapex ESM, escape-html 1.0.3, fast-escape-html 1.1.0 and html-escaper 3.0.3; four rounds per implementation across 25 cases. The existing harness validates output before timing.',
  '- Context APIs: compare the saved escapex ESM artifact with entities 9.0.0, six rounds per implementation in alternating order. Only include a case when every input in its pool produces byte-identical output. No adaptation or normalization is included in timing.',
  '- The entities context APIs are not interchangeable with escapex for arbitrary input. entities escapes U+00A0; its attribute API leaves apostrophes and CR/LF unchanged. This is verified by checking every UTF-16 code unit and by validating the corpus. API source: [entities 9.0.0](https://github.com/fb55/entities/blob/v9.0.0/src/escape.ts).',
  '- All reported numbers are medians of independent process means. Minimum/maximum ranges and every individual sample are retained in the JSON. Ranges are not confidence intervals.',
  '- The compared libraries may accept different non-string inputs. Timed inputs here are primitive strings.', '',
  '| API | Matched cases | Cases with lower escapex median than every compared library |',
  '|---|---:|---:|',
  ...facts.map(fact => `| ${fact.operation} | ${fact.cases} | ${fact.lowerEsmMedians} |`), '',
  'Case counts are descriptive, with no application-frequency weighting; they are not an overall performance score.', '',
];
for (const result of datasets) {
  const context = result.operation !== 'escapeHTML';
  lines.push(`## ${result.operation}`, '',
    context ? `Included ${result.included.length} of 28 cases. Excluded because outputs differ: ${result.excluded.map(row => row.name).join(', ') || 'none'}.` : 'All 25 HTML cases are included.', '',
    'Times are microseconds per call. Ratio is escapex median divided by the lowest competitor median; below 1 favors escapex.', '',
    `| Case | ${result.variants.join(' | ')} | Ratio |`,
    `|---|${result.variants.map(() => '---:').join('|')}|---:|`);
  for (const row of result.summary) {
    const best = Math.min(...result.variants.filter(value => value !== 'esm').map(value => row.nsPerCall[value]));
    lines.push(`| ${row.name} | ${result.variants.map(variant => (row.nsPerCall[variant] / 1000).toFixed(3)).join(' | ')} | ${(row.nsPerCall.esm / best).toFixed(3)} |`);
  }
  const file = context ? `node24-entities-${result.operation}.json` : 'node24-competitors-escapeHTML.json';
  lines.push('', `Raw process samples, ranges, source hashes and metadata: [${file}](./${file}).`, '');
}
lines.push('## Reproduce', '',
  'Use Node 24.22.2 and the unchanged source commit above, with the saved baseline-dist files. Install comparison dependencies before timing, then run sequentially:', '',
  '```sh',
  'npm ci --prefix bench/competitors --ignore-scripts',
  'npm ci --prefix bench/results/esm-context-baseline-20261121/competitor-packages --ignore-scripts',
  'node bench/results/esm-context-baseline-20261121/compare-context.mjs escapeText',
  'node bench/results/esm-context-baseline-20261121/compare-context.mjs escapeAttribute',
  'BENCH_VARIANTS=esm,escape-html,fast-escape-html,html-escaper BENCH_ROUNDS=4 \\',
  '  BENCH_OPERATION=escapeHTML BENCH_SOURCE_COMMIT="$(git rev-parse HEAD)" \\',
  '  BENCH_OUTPUT=bench/results/esm-context-baseline-20261121/node24-competitors-escapeHTML.json \\',
  '  node bench/competitors/run.mjs',
  'node bench/results/esm-context-baseline-20261121/summarize-competition.mjs',
  '```', '',
  'The initial ESM-only matrix, bundle sizes and validation are in [README.md](./README.md). Competitor comparisons above have not been repeated on Node 22/26, other CPUs or browsers.', '',
  '## Optimization acceptance criteria', '',
  'Keep the public output and error contracts and current bundle-size budgets. Target lower per-case times against equivalent competitors, including short, unchanged, sparse, dense and mixed inputs. Remeasure the baseline and candidate in alternating order on Node 22/24/26; investigate regressions rather than hiding them in an aggregate. Confirm on additional CPUs and browser engines before claiming broader leadership.', '',
);
await writeFile(new URL('COMPETITION.md', import.meta.url), lines.join('\n'));
await writeFile(new URL('competition-summary.json', import.meta.url), JSON.stringify(facts, null, 2) + '\n');
console.log(JSON.stringify(facts.map(fact => ({ ...fact, largestGaps: fact.largestGaps.slice(0, 4) })), null, 2));
