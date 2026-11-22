// Run before performance timing; package installation and bundling use CPU.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { preparePackage, bundleConsumer, root } from '../../../scripts/package-fixture.mjs';

const fixture = await preparePackage();
const results = [];
try {
  for (const tool of ['rolldown', 'vite']) {
    for (const operation of ['escapeHTML', 'escapeText', 'escapeAttribute', 'unescapeHTML']) {
      const { output } = await bundleConsumer(fixture.consumer, tool, { only: operation });
      assert.equal(output.length, 1);
      assert.equal(typeof output[0].code, 'string');
      const code = output[0].code.replace(/^\/\/ .*\r?\n/gm, '');
      results.push({ tool, operation, bytes: Buffer.byteLength(code), gzipBytes: gzipSync(code).byteLength,
        sha256: createHash('sha256').update(code).digest('hex') });
    }
  }
  const versions = {};
  for (const name of ['rolldown', 'vite', 'tsdown']) {
    versions[name] = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'))).version;
  }
  await writeFile(new URL('bundle-sizes.json', import.meta.url), JSON.stringify({ node: process.version, versions,
    method: 'Single named export, minified browser ESM bundle from installed npm pack archive; source-path line comments removed before raw and gzip measurement.',
    results }, null, 2) + '\n');
  console.log(JSON.stringify(results));
} finally { await rm(fixture.consumer, { recursive: true, force: true }); }
