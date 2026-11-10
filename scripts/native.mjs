import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from './native-targets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const scalar = args.includes('--scalar');
const metadataOnly = args.includes('--metadata');
const targetArg = args.indexOf('--target');
const triple = targetArg === -1 ? execFileSync('rustc', ['-vV'], { encoding: 'utf8' }).match(/^host: (.+)$/m)[1].trim() : args[targetArg + 1];
const target = targets.find((candidate) => candidate.triple === triple);
if (!target) throw new Error(`Unsupported native build target: ${triple}`);
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lockPath = join(root, 'package-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));

// Metadata is deterministic and can be refreshed without compiling other targets.
for (const entry of targets) {
	const dir = join(root, 'npm', entry.id);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'package.json'), JSON.stringify({
		name: `${metadata.name}-${entry.id}`, version: metadata.version,
		description: `Native ${entry.id} binary for ${metadata.name}`,
		license: metadata.license, repository: metadata.repository,
		main: `escape_html.${entry.id}.node`, files: ['*.node', 'LICENSE'],
		os: [entry.os], cpu: [entry.cpu], ...(entry.libc ? { libc: [entry.libc] } : {}),
		engines: metadata.engines, publishConfig: { access: 'public' },
	}, null, 2) + '\n');
	copyFileSync(join(root, 'LICENSE'), join(dir, 'LICENSE'));
	// These packages have not been published yet. Source installs resolve the
	// exact same versions from the checked-in manifests; npm omits this lockfile
	// from the published package, whose optionalDependencies remain registry versions.
	lock.packages[`node_modules/${metadata.name}-${entry.id}`] = {
		version: metadata.version, resolved: `file:npm/${entry.id}`, optional: true,
		license: metadata.license, os: [entry.os], cpu: [entry.cpu],
		...(entry.libc ? { libc: [entry.libc] } : {}), engines: metadata.engines,
	};
}
lock.packages = Object.fromEntries(Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, 'en')));
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

if (!metadataOnly) {
	// Never inherit target-cpu=native / +avx2 into a distributable binary.
	const flags = target.libc === 'musl' ? '-C target-feature=-crt-static' : '';
	const targetDir = join(root, 'target', scalar ? 'native-scalar' : 'native');
	execFileSync('cargo', ['build', '--manifest-path', 'rust/Cargo.toml', '--release', '--locked',
		'--features', scalar ? 'native-scalar' : 'native', '--target', triple, '--target-dir', targetDir], {
		cwd: root, stdio: 'inherit', env: { ...process.env, RUSTFLAGS: flags, CARGO_ENCODED_RUSTFLAGS: flags ? '-C\x1ftarget-feature=-crt-static' : '' },
	});
	const library = target.os === 'win32' ? 'escape_html_wasm.dll' : `libescape_html_wasm.${target.os === 'darwin' ? 'dylib' : 'so'}`;
	const binary = join(targetDir, triple, 'release', library);
	const file = `escape_html.${target.id}.node`;
	const local = scalar ? join(root, 'target', 'native-scalar-api') : join(root, 'dist');
	mkdirSync(join(local, 'native'), { recursive: true });
	copyFileSync(binary, join(local, 'native', file));
	if (scalar) {
		for (const name of ['native.mjs', 'escape-core.mjs']) copyFileSync(join(root, 'dist', name), join(local, name));
	}
	else copyFileSync(binary, join(root, 'npm', target.id, file));
	console.log(`Built ${target.id}${scalar ? ' (scalar benchmark)' : ''}`);
}
