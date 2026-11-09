import assert from 'node:assert/strict';
import { workerData } from 'node:worker_threads';
import * as reference from '../../dist/index.mjs';

const api = await import(workerData.specifier);
for (let iteration = 0; iteration < 200; iteration++) {
	const value = `worker ${workerData.index}: 日本語😀\0\ud800&<>\'"\r\n\udfff`.repeat(iteration % 19 === 0 ? 4096 : iteration % 37);
	for (const name of Object.keys(reference)) assert.equal(api[name](value), reference[name](value));
}
