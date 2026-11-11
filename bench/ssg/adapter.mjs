import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { join } from 'node:path';
import { createProfile, recordInput } from './profile.mjs';

const requireCompetitor = createRequire(new URL('../competitors/package.json', import.meta.url));
const variant = process.env.SSG_VARIANT;
const started = performance.now();
let fn;
switch (variant) {
	case 'native': fn = (await import('../../dist/native.mjs')).escapeHTML; break;
	case 'wasm': {
		const api = await import('../../dist/wasm.mjs');
		await api.init(readFileSync(new URL('../../dist/escape_html.wasm', import.meta.url)));
		fn = api.escapeHTML;
		break;
	}
	case 'escape-html': fn = requireCompetitor('escape-html'); break;
	case 'fast-escape-html': fn = requireCompetitor('fast-escape-html').escapeHTML; break;
	case 'html-escaper': fn = requireCompetitor('html-escaper').escape; break;
	default: throw new Error(`Unknown SSG variant: ${variant}`);
}
const loadMs = performance.now() - started;
const profile = process.env.SSG_PROFILE === '1' ? createProfile() : undefined;
const destination = join(process.env.SSG_RUN_DIR, `adapter-${process.pid}-${threadId}.json`);
const flush = () => writeFileSync(destination, JSON.stringify({ variant, pid: process.pid, threadId, loadMs, profile }));
flush();
let pending = false;
function profiled(input) {
	recordInput(profile, input);
	// Profile builds are untimed. Flush before a render response reaches the
	// parent: Astro terminates its workers without a normal process exit.
	if (!pending) {
		pending = true;
		queueMicrotask(() => { pending = false; flush(); });
	}
	return fn(input);
}
process.on('exit', flush);
// Timed builds call the public function directly, with no per-call wrapper.
export const escapeHTML = profile ? profiled : fn;
