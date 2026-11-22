import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { median } from '../../stats.mjs';

const load=async file=>JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
const protocol=await load('protocol.json');
assert(protocol.completedAt,'Measurements must finish first');
const datasets=[];
for(const major of [22,24,26])for(const operation of ['escapeText','escapeAttribute',...(major===24?['escapeHTML']:[])]) {
  const file=`node${major}-${operation}.json`,result=await load(file);
  assert.equal(result.operation,operation);
  assert.equal(Number(result.environment.node.split('.')[0].slice(1)),major);
  assert.equal(result.summary.length,operation==='escapeHTML'?25:28);
  assert.equal(result.runs.length,result.rounds*result.variants.length);
  for(const variant of result.variants) {
    const runs=result.runs.filter(run=>run.variant===variant);
    assert.equal(new Set(runs.map(run=>run.round)).size,result.rounds);
    for(const row of result.summary) {
      const samples=runs.map(run=>run.measurements.find(item=>item.name===row.name)?.nsPerCall);
      if(variant==='entities'&&samples.every(value=>value===undefined))continue;
      assert(samples.every(value=>Number.isFinite(value)&&value>0));
      assert.equal(row.nsPerCall[variant],median(samples));
      assert.deepEqual(row.ranges[variant],{min:Math.min(...samples),max:Math.max(...samples)});
    }
  }
  for(const row of result.summary) {
    const paired=Array.from({length:result.rounds},(_,index)=>{
      const value=variant=>result.runs.find(run=>run.variant===variant&&run.round===index+1).measurements.find(item=>item.name===row.name).nsPerCall;
      return value('after')/value('before');
    });
    assert.deepEqual(row.pairedAfterOverBefore.samples,paired);
    assert.equal(row.pairedAfterOverBefore.median,median(paired));
  }
  for(const name of ['before-dist/index.mjs','before-dist/escape-core.mjs','after-dist/index.mjs','after-dist/escape-core.mjs','../../../src/escape.ts']) {
    const hash=createHash('sha256').update(await readFile(new URL(name,import.meta.url))).digest('hex');
    assert.equal(result.sha256[name],hash,`Measured file differs: ${name}`);
  }
  datasets.push({file,...result});
}
const oldBundles=await load('../esm-context-baseline-20261121/bundle-sizes.json');
const bundles=await load('bundle-sizes.json');
for(const row of bundles.results) {
  const limits={rolldown:{escapeText:355,escapeAttribute:365},vite:{escapeText:395,escapeAttribute:405}};
  if(limits[row.tool][row.operation])assert(row.gzipBytes<=limits[row.tool][row.operation]);
}
const summary=datasets.map(result=>({node:result.environment.node,operation:result.operation,
  improved:result.summary.filter(row=>row.pairedAfterOverBefore.median<0.95).length,
  regressed:result.summary.filter(row=>row.pairedAfterOverBefore.median>1.05).map(row=>({name:row.name,ratio:row.pairedAfterOverBefore.median,
    overlappingRanges:row.ranges.after.min<=row.ranges.before.max&&row.ranges.before.min<=row.ranges.after.max})),
  rows:result.summary.map(row=>({name:row.name,beforeUs:row.nsPerCall.before/1000,afterUs:row.nsPerCall.after/1000,
    pairedChangePercent:(row.pairedAfterOverBefore.median-1)*100,
    ...(row.nsPerCall.entities?{entitiesUs:row.nsPerCall.entities/1000}:{}),ranges:row.ranges})),
  ...(result.variants.includes('entities')?{entityComparisons:result.summary.filter(row=>row.nsPerCall.entities).length,
    lowerAfterMediansThanEntities:result.summary.filter(row=>row.nsPerCall.entities&&row.nsPerCall.after<row.nsPerCall.entities).length}:{}),
}));
const env=datasets[0].environment;
const lines=['# ESM context escaping optimization','',
  'The context APIs now use packed, context-specific entity tables and consume adjacent escape targets in one character scan. Regexp search skips clean spans. Text waits for an adjacent pair before scanning; attributes wait for a pair separated by at most three unchanged units. Isolated matches stay in regexp search. Primitive-string validation remains at each public entry.', '',
  'The public output, error messages and existing bundle-size limits are unchanged. The shared UTF-16 test fixture now exercises every code unit immediately after two escape targets, covering both continuation and exit from a run.', '',
  `Baseline commit: [${protocol.baselineCommit.slice(0,7)}](https://github.com/jp-knj/escapex/commit/${protocol.baselineCommit}). Candidate source SHA-256: ${datasets[0].sha256['../../../src/escape.ts']}.`, '',
  `Host: ${env.cpu}, ${env.platform} ${env.arch}, Darwin ${env.os}. Measurements: ${protocol.startedAt} through ${protocol.completedAt}.`, '',
  '## Protocol','',
  '- Keep the existing 28-case context corpus and 25-case HTML control. Each implementation runs in a fresh process with rotated execution order.',
  '- Node 24: six rounds each for before, after and entities 9.0.0. Node 22/26: four rounds each for before and after. HTML control: four rounds on Node 24.',
  '- Per case: at least 100 ms warmup and 10,000 calls below 256 UTF-16 units or 1,000 calls otherwise; explicit GC; at least 300 ms measurement. Consume every output with Buffer.byteLength. Imports and initialization are excluded.',
  '- Report process-mean medians and median before/after ratios paired within the same round. Preserve all samples and minimum/maximum ranges in JSON. Ranges are not confidence intervals.',
  '- Validate every input against the independent oracle before timing. entities is compared only on byte-identical corpus outputs: 28 text cases and 22 attribute cases. Its U+00A0, apostrophe and CR/LF behavior differs from escapex; see [the baseline comparison](../esm-context-baseline-20261121/COMPETITION.md).',
  '- Snapshots, the runtime source and harness are hashed before and after every dataset. Background load and CPU frequency are uncontrolled. These are single-host microbenchmarks, not a cross-platform or full-build speedup claim.', '',
  '## Results','',
  'Times are microseconds per call. Change is the median paired time change; negative means less time. The comparison against entities uses the same measured inputs but does not establish equivalence for arbitrary strings.', '',
];
lines.push('### At a glance', '', '| Node | API | dense-255 | quoted-json | short |', '|---|---|---:|---:|---:|');
for(const result of summary.filter(result=>result.operation!=='escapeHTML')) {
  const change=name=>`${result.rows.find(row=>row.name===name).pairedChangePercent.toFixed(1)}%`;
  lines.push(`| ${result.node} | ${result.operation} | ${change('dense-255')} | ${change('quoted-json')} | ${change('short')} |`);
}
lines.push('');
for(const result of summary.filter(result=>result.entityComparisons)) {
  const behind=result.rows.filter(row=>row.entitiesUs&&row.afterUs>=row.entitiesUs);
  lines.push(`- Node ${result.node} ${result.operation}: after has a lower median than entities in ${result.lowerAfterMediansThanEntities}/${result.entityComparisons} comparable cases. Cases at or above entities: ${behind.map(row=>`${row.name} (+${((row.afterUs/row.entitiesUs-1)*100).toFixed(1)}%)`).join(', ')}.`);
}
const regressions=summary.flatMap(result=>result.regressed.map(row=>`Node ${result.node} ${result.operation}/${row.name}: +${((row.ratio-1)*100).toFixed(1)}%, sample ranges ${row.overlappingRanges?'overlap':'do not overlap'}`));
lines.push('', 'Paired increases above 5%: '+(regressions.length?regressions.join('; ')+'.':'none in this run.'), '');
const control=summary.find(result=>result.operation==='escapeHTML');
lines.push(`The unchanged HTML control spans ${Math.min(...control.rows.map(row=>row.pairedChangePercent)).toFixed(1)}% to +${Math.max(...control.rows.map(row=>row.pairedChangePercent)).toFixed(1)}% paired change. Small differences should be interpreted in light of that variation; lower medians do not prove a statistically significant advantage.`, '');
for(const result of datasets) {
  const entities=result.variants.includes('entities');
  lines.push(`### ${result.operation}, Node ${result.environment.node}`, '',
    `| Case | Before | After | Paired change |${entities?' entities |':''}`,
    `|---|---:|---:|---:|${entities?'---:|':''}`);
  for(const row of result.summary)lines.push(`| ${row.name} | ${(row.nsPerCall.before/1000).toFixed(3)} | ${(row.nsPerCall.after/1000).toFixed(3)} | ${((row.pairedAfterOverBefore.median-1)*100).toFixed(1)}% |${entities?` ${row.nsPerCall.entities?(row.nsPerCall.entities/1000).toFixed(3):'different output'} |`:''}`);
  lines.push('',`[Raw samples and ranges](./${result.file}).`,'');
}
lines.push('## Individual-export bundle sizes','',
  'Gzip bytes using the installed package, with host-specific source-path comments removed. Existing limits remain unchanged.', '',
  '| Bundler | Export | Before | After |', '|---|---|---:|---:|',
  ...bundles.results.map(row=>`| ${row.tool} | ${row.operation} | ${oldBundles.results.find(old=>old.tool===row.tool&&old.operation===row.operation).gzipBytes} | ${row.gzipBytes} |`), '',
  '[Raw sizes and bundle hashes](./bundle-sizes.json). HTML and unescape bundles retain their baseline hashes.', '',
  '## Validation','',
  '- npm test passed, including ESM, Wasm, package/bundler, documentation, benchmark and release tests: [log](./tests.log).',
  '- TypeScript, Rust format and Clippy checks passed: [log](./check.log).',
  '- Native build and all 11 native/package tests passed: [log](./native-tests.log).',
  '- ESM tests passed on Node 22 and Node 26: [Node 22](./node22-tests.log), [Node 26](./node26-tests.log).',
  '- Delivered src/escape.ts and the expanded fixture to the original workspace after verifying it had no concurrent edits. Rebuilt there: npm test and all 11 native/package tests passed ([workspace tests](./workspace-tests.log), [native tests](./workspace-native-tests.log)). The delivered ESM files exactly match the measured candidate: [SHA-256 hashes](./workspace-sha256.json).',
  '- Browser validation could not launch Chromium in this sandbox (OS permission failure); browser results are unverified: [log](./browsers.log).', '',
  '## Reproduce','',
  'Install the pinned entities dependency from the baseline directory, preserve both ESM snapshot directories, and run one command at a time. Use the exact Node executables recorded in protocol.json.', '',
  '```sh',
  'npm ci --prefix bench/results/esm-context-baseline-20261121/competitor-packages --ignore-scripts',
  'COMPARE_VARIANTS=before,after,entities COMPARE_ROUNDS=6 node bench/results/esm-context-optimization-20261121/compare.mjs escapeText',
  'COMPARE_VARIANTS=before,after,entities COMPARE_ROUNDS=6 node bench/results/esm-context-optimization-20261121/compare.mjs escapeAttribute',
  '# Node 22 and Node 26: repeat both commands with before,after and 4 rounds.',
  'COMPARE_VARIANTS=before,after COMPARE_ROUNDS=4 node bench/results/esm-context-optimization-20261121/compare.mjs escapeHTML',
  'node bench/results/esm-context-optimization-20261121/summarize.mjs',
  '```', '',
  'Candidate selection used shorter exploratory screens before the full acceptance runs. Selection results are not used for the performance claims above.', '',
);
await writeFile(new URL('README.md',import.meta.url),lines.join('\n'));
await writeFile(new URL('summary.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary.map(({rows,...rest})=>({...rest,selected:rows.filter(row=>['short','dense-255','quoted-json','japanese-emoji','sparse-8192','mixed-context'].includes(row.name))})),null,2));
