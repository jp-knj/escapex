import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { transform } from '@astrojs/compiler-rs';

const dir = new URL('./generated/', import.meta.url);
await mkdir(dir, { recursive: true });
for (const name of ['large-props', 'official-portfolio-hero', 'official-with-vitest']) {
	const source = await readFile(new URL(`./fixtures/${name}.astro`, import.meta.url), 'utf8');
	const result = transform(source, { filename: `${name}.astro`,
		internalURL: 'astro/compiler-runtime', resultScopedSlot: true, inlineComponentAssets: true,
		resolvePath: (specifier) => specifier });
	const errors = result.diagnostics.filter(({ severity }) => severity === 'error');
	if (errors.length) throw new Error(JSON.stringify(errors));
	await writeFile(new URL(`${name}.mjs`, dir), stripTypeScriptTypes(result.code, { mode: 'transform' }));
}
