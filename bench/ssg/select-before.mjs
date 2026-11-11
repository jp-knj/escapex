// Only benchmark children use this resolver. No wrapper is added to API calls.
import { registerHooks } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const current = new URL('../../dist/native.mjs', import.meta.url).href;
const before = new URL('../../target/ssg-tuning/before-api/native.mjs', import.meta.url).href;
// Install the same hook for every variant so baseline selection does not add
// module-resolution overhead to just one measured full build.
registerHooks({ resolve(specifier, context, nextResolve) {
	const resolved = nextResolve(specifier, context);
	if (resolved.url !== current) return resolved;
	const url = process.env.SSG_BEFORE === '1' ? before : current;
	if (process.env.SSG_RUN_DIR) writeFileSync(join(process.env.SSG_RUN_DIR, 'selection.json'), JSON.stringify({ url }));
	return { ...resolved, url };
} });
