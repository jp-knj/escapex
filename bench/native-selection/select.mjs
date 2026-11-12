import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const native = new URL('../../dist/native.mjs', import.meta.url).href;
const worker = new URL('../competitors/worker.mjs', import.meta.url).href;
const fixtures = new URL('../competitors/cases.mjs', import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
	const resolved = nextResolve(specifier, context);
	if (resolved.url === native && process.env.SELECTION_API) return { ...resolved, url: pathToFileURL(process.env.SELECTION_API).href };
	if (context.parentURL === worker && resolved.url === fixtures) return { ...resolved, url: new URL('./cases.mjs', import.meta.url).href };
	return resolved;
} });
