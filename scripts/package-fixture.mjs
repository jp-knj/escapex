import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
import { build as viteBuild } from 'vite';
import { targets } from './native-targets.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const metadata = JSON.parse(await readFile(join(root, 'package.json')));
export const packageName = metadata.name;
export const nativeInstaller = `${packageName}-native`;

export function npm(args, options = {}) {
	// npm_execpath avoids spawning npm.cmd through a shell on Windows.
	if (!process.env.npm_execpath && process.platform === 'win32') throw new Error('Run package tests through npm run test:native on Windows');
	return execFileSync(process.env.npm_execpath ? process.execPath : 'npm',
		[...(process.env.npm_execpath ? [process.env.npm_execpath] : []), ...args], options);
}

export async function preparePackage({ native = false } = {}) {
	const consumer = await mkdtemp(join(tmpdir(), 'html-escape-consumer-'));
	// Release assembly supplies its final archives, so these tests never repack
	// or substitute bytes when verifying a release candidate.
	const candidate = process.env.RELEASE_CANDIDATE_DIR && resolve(root, process.env.RELEASE_CANDIDATE_DIR);
	const archiveName = name => `${name.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`;
	const mainArchive = candidate && join(candidate, archiveName(packageName));
	const [pack] = JSON.parse(npm(['pack', ...(mainArchive ? [mainArchive, '--dry-run'] : []),
		'--json', '--ignore-scripts', '--pack-destination', consumer,
		'--cache', join(consumer, '.npm-cache')], { cwd: root, encoding: 'utf8' }));
	assert.deepEqual(pack.files.map(({ path }) => path).sort(), [
		'LICENSE', 'README.md', 'USAGE.md', 'CHANGELOG.md', 'package.json', 'dist/index.mjs', 'dist/index.d.mts',
		'dist/wasm.mjs', 'dist/wasm.d.mts', 'dist/escape_html.wasm', 'dist/escape_html.scalar.wasm',
		'dist/native.mjs', 'dist/native.d.mts',
		'dist/escape-core.mjs',
	].sort());
	const installed = join(consumer, 'node_modules', packageName);
	await writeFile(join(consumer, 'package.json'), '{"type":"module","private":true}\n');
	let nativePackage;
	const install = archives => npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
		...archives, '--cache', join(consumer, '.npm-cache')], { cwd: consumer, stdio: 'pipe' });
	// A normal install must not fetch any native package. Do not omit optional deps:
	// that would hide a regression back to automatic binary installation.
	install([mainArchive || join(consumer, pack.filename)]);
	assert.deepEqual((await readdir(join(consumer, 'node_modules'))).filter(name => !name.startsWith('.')), [packageName]);
	const installedMetadata = JSON.parse(await readFile(join(installed, 'package.json')));
	assert.equal(installedMetadata.optionalDependencies, undefined);
	assert.deepEqual(installedMetadata.peerDependencies, { [nativeInstaller]: metadata.version });
	assert.deepEqual(installedMetadata.peerDependenciesMeta, { [nativeInstaller]: { optional: true } });
	if (native) {
		const target = targets.find((entry) => entry.os === process.platform && entry.cpu === process.arch
			&& (!entry.libc || entry.libc === (process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl')));
		assert(target, 'Supported native test platform');
		nativePackage = `${packageName}-${target.id}`;
		const nativeArchive = candidate && join(candidate, archiveName(nativePackage));
		const [binaryPack] = JSON.parse(npm(['pack', ...(nativeArchive ? [nativeArchive, '--dry-run'] : []),
			'--json', '--ignore-scripts', '--pack-destination', consumer,
			'--cache', join(consumer, '.npm-cache')], { cwd: join(root, 'npm', target.id), encoding: 'utf8' }));
		assert.deepEqual(binaryPack.files.map(({ path }) => path).sort(), ['LICENSE', 'package.json', `escape_html.${target.id}.node`].sort());
		const installerArchive = candidate && join(candidate, archiveName(nativeInstaller));
		const [installerPack] = JSON.parse(npm(['pack', ...(installerArchive ? [installerArchive, '--dry-run'] : []),
			'--json', '--ignore-scripts', '--pack-destination', consumer,
			'--cache', join(consumer, '.npm-cache')], { cwd: join(root, 'npm/native'), encoding: 'utf8' }));
		assert.deepEqual(installerPack.files.map(({ path }) => path).sort(), ['LICENSE', 'README.md', 'package.json']);
		// Exercise adding native support to an existing JS/Wasm installation.
		install([installerArchive || join(consumer, installerPack.filename), nativeArchive || join(consumer, binaryPack.filename)]);
	}
	return { consumer, installed, pack, nativePackage, nativeInstaller };
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
