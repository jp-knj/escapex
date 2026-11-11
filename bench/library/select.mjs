import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const native = new URL('../../dist/native.mjs', import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
	const resolved = nextResolve(specifier, context);
	return resolved.url === native && process.env.LIBRARY_API
		? { ...resolved, url: pathToFileURL(process.env.LIBRARY_API).href } : resolved;
} });
