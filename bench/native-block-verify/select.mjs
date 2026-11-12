import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const native = new URL('../../dist/native.mjs', import.meta.url).href;
const fixture = new URL('../competitors/cases.mjs', import.meta.url).href;
const worker = new URL('../competitors/worker.mjs', import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  const resolved = nextResolve(specifier, context);
  if (resolved.url === native && process.env.SCAN_API) return { ...resolved, url: pathToFileURL(process.env.SCAN_API).href };
  if (context.parentURL === worker && resolved.url === fixture) return { ...resolved, url: new URL('./cases.mjs', import.meta.url).href };
  return resolved;
} });
