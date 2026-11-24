import assert from 'node:assert/strict';
import { targets } from './native-targets.mjs';

// Shared by assembly and publication; reject dependency drift before any writes.
export function validateNativeMetadata(metadata, installer) {
	assert.equal(metadata.optionalDependencies, undefined);
	assert.deepEqual(metadata.peerDependencies, { [`${metadata.name}-native`]: metadata.version });
	assert.deepEqual(metadata.peerDependenciesMeta, { [`${metadata.name}-native`]: { optional: true } });
	assert.equal(installer.name, `${metadata.name}-native`);
	assert.equal(installer.version, metadata.version, 'Native installer version mismatch');
	assert.deepEqual(installer.exports, { './package.json': './package.json' });
	assert.deepEqual(installer.files, ['README.md', 'LICENSE']);
	assert.equal(installer.repository.url, metadata.repository.url);
	assert.equal(installer.publishConfig.access, 'public');
	assert.deepEqual(installer.optionalDependencies,
		Object.fromEntries(targets.map(target => [`${metadata.name}-${target.id}`, metadata.version])));
}

export function publicationNames(metadata) {
	return [...targets.map(target => `${metadata.name}-${target.id}`), `${metadata.name}-native`, metadata.name];
}
