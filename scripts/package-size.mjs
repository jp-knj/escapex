// Measure the shipped archives and browser bundles; never publish or minify sources.
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { rolldown } from 'rolldown';
import { preparePackage, npm, metadata, root } from './package-fixture.mjs';
import { targets } from './native-targets.mjs';

const args = process.argv.slice(2);
let output = 'target/package-size.json', native = [];
for (let index = 0; index < args.length; index++) {
	if (args[index] === '--output') { assert(args[index + 1]); output = args[++index]; }
	else if (args[index] === '--native') {
		const id = args[++index];
		const target = targets.find(target => target.id === id);
		assert(target, 'Expected a supported --native platform');
		native.push(target);
	} else if (args[index] === '--all-native') native = [...targets];
	else throw new Error(`Unknown size option: ${args[index]}`);
}
const limits = { unpackedBytes: 45000, archiveBytes: 15000, browserAllBytes: 2500 };
const fixture = await preparePackage();
try {
	const size = pack => ({ name: pack.name, unpackedBytes: pack.unpackedSize, archiveBytes: pack.size });
	const candidate = process.env.RELEASE_CANDIDATE_DIR && resolve(root, process.env.RELEASE_CANDIDATE_DIR);
	const pack = (name, directory) => {
		const archive = candidate && join(candidate, `${name}-${metadata.version}.tgz`);
		return JSON.parse(npm(['pack', ...(archive ? [archive] : []), '--dry-run', '--json', '--ignore-scripts',
			'--cache', join(fixture.consumer, '.npm-cache')], { cwd: directory, encoding: 'utf8' }))[0];
	};
	const installer = pack(`${metadata.name}-native`, join(root, 'npm/native'));
	assert.deepEqual(installer.files.map(file => file.path).sort(), ['LICENSE', 'README.md', 'package.json']);
	const report = { version: metadata.version, node: process.version, platform: process.platform, arch: process.arch,
		limits, main: size(fixture.pack), installer: size(installer), native: [], browser: {} };
	for (const target of native) {
		const packed = pack(`${metadata.name}-${target.id}`, join(root, 'npm', target.id));
		assert(packed.files.some(file => file.path === `escape_html.${target.id}.node`), `Missing binary: ${target.id}`);
		report.native.push(size(packed));
	}
	for (const name of ['all', 'escape', 'escapeHTML', 'escapeText', 'escapeAttribute', 'unescape', 'unescapeHTML']) {
		const entry = join(fixture.consumer, 'size.mjs');
		await writeFile(entry, `export ${name === 'all' ? '*' : `{ ${name} }`} from '${metadata.name}';\n`);
		const bundle = await rolldown({ input: entry, platform: 'browser' });
		try {
			const { output } = await bundle.generate({ format: 'es', minify: true });
			assert(output.every(file => file.type === 'chunk' && file.imports.length === 0));
			report.browser[name] = output.reduce((bytes, file) => bytes + Buffer.byteLength(file.code), 0);
		} finally { await bundle.close(); }
	}
	const destination = resolve(root, output);
	await mkdir(dirname(destination), { recursive: true });
	await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
	console.log(JSON.stringify(report, null, 2));
	assert(report.main.unpackedBytes <= limits.unpackedBytes, 'Main unpacked size exceeds budget');
	assert(report.main.archiveBytes <= limits.archiveBytes, 'Main archive size exceeds budget');
	assert(report.browser.all <= limits.browserAllBytes, 'Browser all-API bundle exceeds budget');
} finally { await rm(fixture.consumer, { recursive: true, force: true }); }
