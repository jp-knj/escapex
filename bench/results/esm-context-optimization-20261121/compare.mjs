// Paired before/after validation on immutable ESM snapshots; optionally compare
// entities on only the corpus cases with byte-identical output.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { casesFor } from '../../competitors/cases.mjs';
import { reference } from '../../competitors/suite.mjs';
import { median } from '../../stats.mjs';

const operation=process.argv[2];
assert(['escapeText','escapeAttribute','escapeHTML'].includes(operation));
const variants=(process.env.COMPARE_VARIANTS??'before,after').split(',');
const rounds=Number(process.env.COMPARE_ROUNDS??4);
assert(Number.isInteger(rounds)&&rounds>=4);
assert(variants.includes('before')&&variants.includes('after'));
const load=variant=>import(variant==='entities'
  ? '../esm-context-baseline-20261121/competitor-packages/node_modules/entities/dist/escape.js'
  : `./${variant}-dist/index.mjs`);
const outputName=`node${process.versions.node.split('.')[0]}-${operation}.json`;
const cases=Object.entries(casesFor(operation));

if(process.argv[3]==='--worker') {
  const variant=process.argv[4];
  assert(variants.includes(variant));
  const fn=(await load(variant))[operation];
  assert.equal(typeof fn,'function');
  let checksum=0;
  const measurements=[],excluded=[];
  for(const [name,value] of cases) {
    const inputs=Array.isArray(value)?value:[value];
    const matching=inputs.every(input=>fn(input)===reference(operation,input));
    if(variant==='entities'&&!matching){excluded.push(name);continue;}
    assert(matching,`${variant} ${operation} ${name}: output mismatch`);
    const inputUnits=Math.max(...inputs.map(input=>input.length));
    const batch=Math.max(1,Math.min(256,Math.ceil(65536/inputUnits)));
    let cursor=0;
    const consume=inputs.length===1
      ? ()=>{for(let i=0;i<batch;i++)checksum=(checksum+Buffer.byteLength(fn(value)))>>>0;}
      : ()=>{for(let i=0;i<batch;i++){checksum=(checksum+Buffer.byteLength(fn(inputs[cursor])))>>>0;if(++cursor===inputs.length)cursor=0;}};
    const warm=performance.now();let warmIterations=0;
    do{consume();warmIterations+=batch;}while(performance.now()-warm<100||warmIterations<(inputUnits<256?10000:1000));
    global.gc?.();
    const start=performance.now();let iterations=0;
    do{consume();iterations+=batch;}while(performance.now()-start<300);
    measurements.push({name,operation,inputUnits,minimumInputUnits:Math.min(...inputs.map(input=>input.length)),
      inputPoolSize:inputs.length,nsPerCall:(performance.now()-start)*1e6/iterations,warmIterations,iterations});
  }
  console.log(JSON.stringify({variant,operation,measurements,excluded,checksum}));
} else {
  const startedAt=new Date().toISOString();
  const files=['compare.mjs','before-dist/index.mjs','before-dist/escape-core.mjs','after-dist/index.mjs','after-dist/escape-core.mjs',
    '../../../src/escape.ts','../../competitors/cases.mjs','../../competitors/suite.mjs','../../stats.mjs'];
  if(variants.includes('entities'))files.push('../esm-context-baseline-20261121/competitor-packages/package-lock.json',
    '../esm-context-baseline-20261121/competitor-packages/node_modules/entities/dist/escape.js');
  const fingerprint=async()=>Object.fromEntries(await Promise.all(files.map(async name=>[name,createHash('sha256').update(await readFile(new URL(name,import.meta.url))).digest('hex')])));
  const sha256=await fingerprint(),runs=[];
  for(let round=0;round<rounds;round++)for(let offset=0;offset<variants.length;offset++) {
    const variant=variants[(round+offset)%variants.length];
    console.error(`${operation} ${round+1}/${rounds} ${variant}`);
    runs.push({round:round+1,...JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),operation,'--worker',variant],{encoding:'utf8'}))});
  }
  const summary=cases.map(([name])=>{
    const nsPerCall={},ranges={};
    for(const variant of variants) {
      const values=runs.filter(run=>run.variant===variant).map(run=>run.measurements.find(row=>row.name===name)?.nsPerCall);
      if(values.every(value=>value===undefined))continue;
      assert(values.every(value=>Number.isFinite(value)&&value>0));
      nsPerCall[variant]=median(values);
      ranges[variant]={min:Math.min(...values),max:Math.max(...values)};
    }
    const paired=Array.from({length:rounds},(_,index)=>{
      const value=variant=>runs.find(run=>run.round===index+1&&run.variant===variant).measurements.find(row=>row.name===name).nsPerCall;
      return value('after')/value('before');
    });
    return {name,nsPerCall,ranges,pairedAfterOverBefore:{median:median(paired),samples:paired}};
  });
  assert.deepEqual(await fingerprint(),sha256,'Measured code changed');
  const result={operation,variants,rounds,startedAt,completedAt:new Date().toISOString(),
    environment:{node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model,platform:process.platform,arch:process.arch,os:release()},
    method:'Fresh process per API/variant/round, rotating variant order; >=100ms and >=10000/1000 calls warmup, explicit GC, >=300ms timing. Buffer.byteLength consumes every output; import/init excluded. Paired ratios use processes in the same round. All original cases retained for before/after; entities is omitted per case when any pool output differs. Ranges are not confidence intervals.',
    versions:variants.includes('entities')?{entities:'9.0.0'}:{},sha256,summary,runs};
  await writeFile(new URL(outputName,import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(`Saved ${outputName}: ${runs.length} processes`);
}
