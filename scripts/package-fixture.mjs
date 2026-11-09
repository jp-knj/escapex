import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
import { build as viteBuild } from 'vite';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const metadata = JSON.parse(await readFile(join(root, 'package.json')));
export const packageName = metadata.name;

export async function preparePackage() {
	const consumer = await mkdtemp(join(tmpdir(), 'html-escape-consumer-'));
	const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', consumer,
		'--cache', join(consumer, '.npm-cache')], { cwd: root, encoding: 'utf8' }));
	assert.deepEqual(pack.files.map(({ path }) => path).sort(), [
		'LICENSE', 'README.md', 'package.json', 'dist/index.mjs', 'dist/index.d.mts',
		'dist/wasm.mjs', 'dist/wasm.d.mts', 'dist/escape_html.wasm', 'dist/escape_html.scalar.wasm',
	].sort());
	const installed = join(consumer, 'node_modules', packageName);
	await mkdir(installed, { recursive: true });
	execFileSync('tar', ['-xzf', join(consumer, pack.filename), '-C', installed, '--strip-components=1']);
	await writeFile(join(consumer, 'package.json'), '{"type":"module","private":true}\n');
	return { consumer, installed, pack };
}

export async function bundleConsumer(consumer, tool, { unused = false, ssr = false } = {}) {
	const name = `${tool}-${unused ? 'unused' : ssr ? 'ssr' : 'browser'}`;
	const entry = join(consumer, `${name}.mjs`);
	const query = tool === 'vite' ? '?url&no-inline' : '';
	const code = unused ? `import { escape, unescape } from '${packageName}';
import { init } from '${packageName}/wasm'; export const marker = 1;` : `
export * as js from '${packageName}';
export * as wasm from '${packageName}/wasm';
${ssr ? '' : `export { default as optimizedUrl } from '${packageName}/escape_html.wasm${query}';
export { default as scalarUrl } from '${packageName}/escape_html.scalar.wasm${query}';`}
export { verifyEscape, verifyContexts } from ${JSON.stringify(join(root, 'test/fixtures/wasm-check.mjs'))};
export { verifyUnescape } from ${JSON.stringify(join(root, 'test/fixtures/unescape-check.mjs'))};
`;
	await writeFile(entry, code);
	const outDir = join(consumer, name);
	let result;
	if (tool === 'rolldown') {
		const bundle = await rolldown({ input: entry, platform: ssr ? 'node' : 'browser', moduleTypes: { '.wasm': 'asset' } });
		try { result = await bundle.write({ dir: outDir, format: 'es', entryFileNames: 'index.mjs', minify: true }); }
		finally { await bundle.close(); }
	} else {
		result = await viteBuild({ configFile: false, root: consumer, base: './', logLevel: 'silent',
			ssr: { noExternal: [packageName] }, build: {
				outDir, emptyOutDir: true, target: 'es2022', minify: 'oxc',
				...(ssr ? { ssr: entry } : { lib: { entry, formats: ['es'], fileName: () => 'index.mjs' } }),
				rolldownOptions: { output: { entryFileNames: 'index.mjs' } },
			} });
	}
	return { name, outDir, output: (Array.isArray(result) ? result[0] : result).output };
}
