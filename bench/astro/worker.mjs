import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRender } from './page.mjs';
import { performance } from 'node:perf_hooks';
import { loadImplementation, moduleUrl } from '../implementations.mjs';

const [variant, scenario] = process.argv.slice(2);
global.gc?.();
const memoryBefore = process.memoryUsage();
const start = performance.now();
await loadImplementation(variant);
const importMs = performance.now() - start;
const memoryAfterImport = process.memoryUsage();
const runtimeStart = performance.now();
const render = await createRender(moduleUrl(variant), scenario);
const runtimeImportMs = performance.now() - runtimeStart;
const firstStart = performance.now();
const html = await render();
const firstRenderMs = performance.now() - firstStart;
assert(html.length > 0);
if (scenario === 'large-props') assert(html.includes('&quot;') && html.includes('日本語'));
const htmlSha256 = createHash('sha256').update(html).digest('hex');
let checksum = 0;
const warm = performance.now();
do { checksum += (await render()).length; } while (performance.now() - warm < 400);
global.gc?.();
const before = performance.now();
let iterations = 0;
do {
	// Reading the complete Response includes UTF-16/UTF-8 copies and HTML collection.
	checksum = (checksum + (await render()).length) >>> 0;
	iterations++;
} while (performance.now() - before < 1200);
const elapsedMs = performance.now() - before;
global.gc?.();
console.log(JSON.stringify({ variant, scenario, importMs, runtimeImportMs, firstRenderMs, msPerRender: elapsedMs / iterations,
	iterations, htmlUnits: html.length, htmlSha256, memoryBefore, memoryAfterImport, memoryAfter: process.memoryUsage(),
	maxRssKiB: process.resourceUsage().maxRSS, checksum }));
