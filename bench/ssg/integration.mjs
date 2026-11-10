import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const adapter = new URL('./adapter.mjs', import.meta.url).href;
export default function benchmarkIntegration() {
	let transforms = 0;
	return {
		name: 'escape-ssg-benchmark',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => updateConfig({ vite: { plugins: [{
				name: 'escape-ssg-replacement', enforce: 'pre',
				resolveId(id) { if (id === 'virtual:escape-ssg') return { id: adapter, external: true }; },
				transform(_code, id) {
					if (!id.replaceAll('\\', '/').endsWith('/astro/dist/runtime/server/escape.js')) return;
					transforms++;
					// Preserve HTMLString and all other Astro runtime exports.
					return `export * from ${JSON.stringify(id + '?ssg-original')}; export { escapeHTML } from 'virtual:escape-ssg';`;
				},
			}] } }),
			'astro:build:done': () => {
				if (transforms === 0) throw new Error('Astro escape replacement was not applied');
				writeFileSync(join(process.env.SSG_RUN_DIR, 'integration.json'), JSON.stringify({ transforms }));
			},
		},
	};
}
