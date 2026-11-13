import { preparePackage, bundleConsumer } from '../../../scripts/package-fixture.mjs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { rm } from 'node:fs/promises';
const fixture = await preparePackage();
const results=[];
try {
 for (const tool of ['rolldown','vite']) {
  for (const only of ['escapeHTML','escapeText','escapeAttribute','unescapeHTML','escape, escapeHTML, escapeText, escapeAttribute, unescape, unescapeHTML']) {
   const {output}=await bundleConsumer(fixture.consumer,tool,{only});
   const code=output[0].code.replace(/^\/\/ .*\r?\n/gm, '');
   results.push({tool,imports:only.includes(',')?'all':only,bytes:Buffer.byteLength(code),gzip:gzipSync(code).length,brotli:brotliCompressSync(code).length});
  }
 }
 console.log(JSON.stringify({node:process.version,results},null,2));
} finally { await rm(fixture.consumer,{recursive:true,force:true}); }
