import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
import { build as viteBuild } from 'vite';
import { targets } from './native-targets.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const metadata = JSON.parse(await readFile(join(root, 'package.json')));
export const packageName = metadata.name;

export function npm(args, options = {}) {
	// npm_execpath avoids spawning npm.cmd through a shell on Windows.
	if (!process.env.npm_execpath && process.platform === 'win32') throw new Error('Run package tests through npm run test:native on Windows');
	return execFileSync(process.env.npm_execpath ? process.execPath : 'npm',
		[...(process.env.npm_execpath ? [process.env.npm_execpath] : []), ...args], options);
}

export async function preparePackage({ native = false } = {}) {
	const consumer = await mkdtemp(join(tmpdir(), 'html-escape-consumer-'));
	const [pack] = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', consumer,
		'--cache', join(consumer, '.npm-cache')], { cwd: root, encoding: 'utf8' }));
	assert.deepEqual(pack.files.map(({ path }) => path).sort(), [
		'LICENSE', 'README.md', 'package.json', 'dist/index.mjs', 'dist/index.d.mts',
		'dist/wasm.mjs', 'dist/wasm.d.mts', 'dist/escape_html.wasm', 'dist/escape_html.scalar.wasm',
		'dist/native.mjs', 'dist/native.d.mts',
		'dist/escape-core.mjs',
	].sort());
	const installed = join(consumer, 'node_modules', packageName);
	await mkdir(installed, { recursive: true });
	execFileSync('tar', ['-xzf', join(consumer, pack.filename), '-C', installed, '--strip-components=1']);
	await writeFile(join(consumer, 'package.json'), '{"type":"module","private":true}\n');
	let nativePackage;
	if (native) {
		const target = targets.find((entry) => entry.os === process.platform && entry.cpu === process.arch
			&& (!entry.libc || entry.libc === (process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl')));
		assert(target, 'Supported native test platform');
		nativePackage = `${packageName}-${target.id}`;
		const [binaryPack] = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', consumer,
			'--cache', join(consumer, '.npm-cache')], { cwd: join(root, 'npm', target.id), encoding: 'utf8' }));
		assert.deepEqual(binaryPack.files.map(({ path }) => path).sort(), ['LICENSE', 'package.json', `escape_html.${target.id}.node`].sort());
		// Install actual tarballs with npm so os/cpu/libc and optional dependency resolution are exercised.
		npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false',
			join(consumer, pack.filename), join(consumer, binaryPack.filename), '--cache', join(consumer, '.npm-cache')],
			{ cwd: consumer, stdio: 'pipe' });
	}
	return { consumer, installed, pack, nativePackage };
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
