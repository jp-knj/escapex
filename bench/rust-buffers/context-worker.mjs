import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import * as reference from '../../dist/index.mjs';
import * as api from '../../dist/native.mjs';
import { cases, methods } from './context-cases.mjs';

let checksum = 0;
const measurements = [];
for (const [name, value] of Object.entries(cases)) {
	const fn = api[methods[name]];
	const inputs = Array.isArray(value) ? value : [value];
	for (const input of inputs) assert.equal(fn(input), reference[methods[name]](input));
	const inputUnits = Math.max(...inputs.map(input => input.length));
	const minimumInputUnits = Math.min(...inputs.map(input => input.length));
	const outputUnits = Math.max(...inputs.map(input => fn(input).length));
	const batch = Math.max(1, Math.min(256, Math.ceil(65536 / inputUnits)));
	let cursor = 0;
	const consume = inputs.length === 1
		? () => { for (let i = 0; i < batch; i++) checksum = (checksum + Buffer.byteLength(fn(value))) >>> 0; }
		: () => {
			for (let i = 0; i < batch; i++) {
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
	measurements.push({ name, inputUnits, minimumInputUnits, inputPoolSize: inputs.length, outputUnits,
		nsPerCall: (performance.now() - start) * 1e6 / iterations, warmIterations, iterations });
}
console.log(JSON.stringify({ variant: 'native', measurements, checksum }));
