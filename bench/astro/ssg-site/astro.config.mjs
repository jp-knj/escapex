import { defineConfig } from 'astro/config';
import { join } from 'node:path';
import benchmarkIntegration from '../../ssg/integration.mjs';

export default defineConfig({
	site: 'https://ssg.example.test',
	output: 'static',
	cacheDir: join(process.env.SSG_RUN_DIR, 'cache'),
	outDir: join(process.env.SSG_RUN_DIR, 'dist'),
	build: { concurrency: 1 },
	experimental: { parallelPrerender: process.env.SSG_WORKERS === '2' ? { workers: 2 } : false },
	integrations: [benchmarkIntegration()],
});
