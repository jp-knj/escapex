// Run interactively once: create the administrative packages with azu's CLI.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from './native-targets.mjs';

assert.equal(process.argv.length, 3, 'Usage: npm run release:bootstrap -- --publish-placeholders');
assert.equal(process.argv[2], '--publish-placeholders', 'Explicit --publish-placeholders is required');
const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);
const cli = require.resolve('setup-npm-trusted-publish/bin/cli.js');
assert.equal(require('setup-npm-trusted-publish/package.json').version, metadata.devDependencies['setup-npm-trusted-publish']);
const names = [...targets.map(target => metadata.name + '-' + target.id), metadata.name];
const output = join(root, 'target/release-setup');
mkdirSync(output, { recursive: true });
const env = { ...process.env, npm_config_cache: join(root, 'target/npm-cache') };
for (const name of names) {
	execFileSync(process.execPath, [cli, name, '--access', 'public', '--package-version', '0.0.0',
		'--registry', 'https://registry.npmjs.org'], { cwd: root, env, stdio: 'inherit' });
}
writeFileSync(join(output, 'packages.txt'), names.join('\n') + '\n');
console.log('Initial packages created. Configure release.yml as the trusted publisher for each package.');
