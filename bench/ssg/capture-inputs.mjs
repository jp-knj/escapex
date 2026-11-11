// Diagnostic preload: capture actual calls without modifying the timed harness.
import { registerHooks } from 'node:module';
import { Buffer } from 'node:buffer';
const adapter = new URL('./adapter.mjs', import.meta.url).href;
const original = 'export const escapeHTML = profile ? profiled : fn;';
registerHooks({ load(url, context, nextLoad) {
	const loaded = nextLoad(url, context);
	if (url !== adapter) return loaded;
	const source = typeof loaded.source === 'string' ? loaded.source : Buffer.from(loaded.source).toString('utf8');
	if (!source.includes(original)) throw new Error('SSG adapter changed; cannot capture inputs');
	return { ...loaded, source: source.replace(original, `
const capturedInputs = [];
export const escapeHTML = input => { capturedInputs.push(input); return fn(input); };
process.on('exit', () => writeFileSync(process.env.SSG_CAPTURE_FILE, JSON.stringify(capturedInputs)));
`) };
} });
