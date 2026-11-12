import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import * as reference from '../../dist/index.mjs';
import { nativePlatform } from '../../src/native-platform.ts';
import { atPositions, cases, runPositions, sampledPositions, spaced } from './cases.mjs';

for (const variant of ['before', 'tail', 'expanded', 'combined']) {
	test(`${variant}: native routing, sample boundaries and independent scanner state`, async () => {
		const dir = await realpath(await mkdtemp(join(tmpdir(), 'html selection ')));
		const require = createRequire(import.meta.url);
		const libc = process.platform === 'linux' ? (process.report.getReport().header.glibcVersionRuntime ? 'gnu' : 'musl') : undefined;
		const binary = join(dir, 'native', `escape_html.${nativePlatform(process.platform, process.arch, libc)}.node`);
		const tail = variant === 'tail' || variant === 'combined';
		const expanded = variant === 'expanded' || variant === 'combined';
		try {
			await mkdir(join(dir, 'native'));
			for (const file of ['native.mjs', 'escape-core.mjs']) await copyFile(new URL(`../../target/native-selection/${variant}/dist/${file}`, import.meta.url), join(dir, file));
			await writeFile(binary, '');
			let calls = 0;
			require.cache[binary] = { exports: { escapeHtml(value) { calls++; return reference.escapeHTML(value); } } };
			const { escapeHTML } = await import(pathToFileURL(join(dir, 'native.mjs')));
			function check(value, native, label) {
				calls = 0;
				assert.equal(escapeHTML(value), reference.escapeHTML(value), label);
				assert.equal(calls, Number(native), label);
			}
			for (const length of [127, 128, 129, 4095, 4096, 4097, 8192]) {
				check('x'.repeat(length), false, `no-op ${length}`);
				for (const gap of [1, 16, 17, 24, 32, 33, 48]) {
					for (const count of [7, 8, 9]) {
						if ((count - 1) * gap >= length) continue;
						for (const location of ['head', 'tail']) {
							const start = location === 'head' ? 0 : length - 1 - (count - 1) * gap;
							const native = length >= 128 && gap <= 16 && count >= 8 && !(tail && count === 8 && location === 'tail');
							check(atPositions(length, runPositions(count, gap, start)), native, `${length}/${gap}/${count}/${location}`);
						}
					}
				}
			}
			for (const length of [4095, 4096, 4097, 8192]) {
				for (const gap of [16, 24, 32, 33, 48]) check(spaced(length, gap), gap <= 16 || (expanded && length >= 4096 && gap <= 32), `spread ${length}/${gap}`);
			}
			// Eight matches must be reached strictly before the exact quarter point.
			for (const length of [4096, 4097]) {
				for (const eighth of [1023, 1024, 1025]) check(atPositions(length, [...runPositions(8, 24, eighth - 7 * 24), ...sampledPositions(length).map(position => position + 16)]),
					expanded && eighth < length / 4, `quarter ${length}/${eighth}`);
			}
			check(atPositions(8192, sampledPositions(8192)), false, 'sampling windows alone cannot qualify');
			for (const count of [7, 8, 9]) {
				check(atPositions(8192, [...runPositions(count, 24), ...sampledPositions(8192)]), expanded && count >= 8, `wide run ${count}`);
			}
			// Every window must contain four matches, including at offset 127 but not 128.
			for (let quarter = 1; quarter <= 3; quarter++) {
				for (const offset of [127, 128]) {
					const positions = [...runPositions(8, 24), ...sampledPositions(4097)];
					positions[8 + (quarter - 1) * 4 + 3] = Math.floor(4097 * quarter / 4) + offset;
					check(atPositions(4097, positions), expanded && offset === 127, `window ${quarter}/${offset}`);
				}
			}
			check(atPositions(8192, [...runPositions(8, 24), ...runPositions(8, 16, 4096)]), true, 'failed sample must allow later existing native run');
			// With an early failed sample, a later wide run cannot try sampling again.
			// Count calls on the dedicated global regexp without changing its result.
			const source = await readFile(join(dir, 'native.mjs'), 'utf8');
			if (expanded) {
				assert(source.includes('HTML_SAMPLE'));
				let sampleCalls = 0;
				const instrumented = source.replace('HTML_SAMPLE.test(sample)', '(globalThis.__selectionSample(), HTML_SAMPLE.test(sample))');
				assert.notEqual(instrumented, source);
				await writeFile(join(dir, 'instrumented.mjs'), instrumented);
				globalThis.__selectionSample = () => { sampleCalls++; };
				try {
					const instrumentedAPI = await import(pathToFileURL(join(dir, 'instrumented.mjs')));
					const value = atPositions(8192, [...runPositions(8, 24), ...runPositions(8, 24, 512), ...runPositions(8, 24, 1024)]);
					assert.equal(instrumentedAPI.escapeHTML(value), reference.escapeHTML(value));
					assert.equal(sampleCalls, 1, 'only the first failing window is checked once per call');
					instrumentedAPI.escapeHTML(value);
					assert.equal(sampleCalls, 2, 'sample state resets on each call');
				} finally { delete globalThis.__selectionSample; }
			}
			for (let iteration = 0; iteration < 3; iteration++) {
				for (const [name, values] of Object.entries(cases)) {
					for (const value of Array.isArray(values) ? values : [values]) assert.equal(escapeHTML(value), reference.escapeHTML(value), name);
				}
			}
		} finally {
			delete require.cache[binary];
			await rm(dir, { recursive: true, force: true });
		}
	});
}
