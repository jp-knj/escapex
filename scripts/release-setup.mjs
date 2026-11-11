// Preview azu's initial-package setup. This command never publishes.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from './native-targets.mjs';

assert.equal(process.argv.length, 2, 'release:setup accepts no arguments and always uses --dry-run');
const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);
const cli = require.resolve('setup-npm-trusted-publish/bin/cli.js');
const tool = require('setup-npm-trusted-publish/package.json');
assert.equal(tool.version, metadata.devDependencies['setup-npm-trusted-publish']);
const names = targets.map(({ id }) => `${metadata.name}-${id}`);
assert.deepEqual([...Object.keys(metadata.optionalDependencies)].sort(), [...names].sort());
names.push(metadata.name);
const destination = join(root, 'target/release-setup');
mkdirSync(destination, { recursive: true });
const scratch = mkdtempSync(join(destination, 'preview-'));
const env = { ...process.env, TMPDIR: scratch, TMP: scratch, TEMP: scratch };
delete env.NPM_TOKEN;
delete env.NODE_AUTH_TOKEN;
const log = [];
for (const name of names) {
	log.push(execFileSync(process.execPath, [cli, name, '--dry-run', '--access', 'public',
		'--package-version', '0.0.0', '--registry', 'https://registry.npmjs.org'], { env, encoding: 'utf8' }));
	console.log(`Previewed ${name}@0.0.0 without publishing`);
}
const previews = readdirSync(scratch).map(directory => {
	const path = join(scratch, directory);
	const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
	assert.equal(pkg.version, '0.0.0');
	assert.deepEqual(readdirSync(path).sort(), ['README.md', 'package.json']);
	return { name: pkg.name, placeholderVersion: pkg.version, directory: path,
		settings: `https://www.npmjs.com/package/${pkg.name}/access` };
});
assert.deepEqual(previews.map(p => p.name).sort(), [...names].sort());
writeFileSync(join(destination, 'preview.log'), log.join('\n'));
writeFileSync(join(destination, 'plan.json'), JSON.stringify({ tool: `${tool.name}@${tool.version}`,
	dryRun: true, releaseVersion: metadata.version, previews }, null, 2) + '\n');
console.log(`Preview files and plan: ${destination}`);
