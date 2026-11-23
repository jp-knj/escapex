import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nativePlatform } from '../src/native-platform.ts';

// Literal package suffixes keep the expectations independent of the selector.
const supported = [
	['darwin', 'arm64', undefined, 'darwin-arm64'],
	['darwin', 'x64', undefined, 'darwin-x64'],
	['win32', 'arm64', undefined, 'win32-arm64-msvc'],
	['win32', 'x64', undefined, 'win32-x64-msvc'],
	['linux', 'arm64', 'gnu', 'linux-arm64-gnu'],
	['linux', 'x64', 'gnu', 'linux-x64-gnu'],
	['linux', 'arm64', 'musl', 'linux-arm64-musl'],
	['linux', 'x64', 'musl', 'linux-x64-musl'],
];

test('native platform: selects all eight supported package suffixes', () => {
	for (const [platform, arch, libc, expected] of supported) {
		assert.equal(nativePlatform(platform, arch, libc), expected);
	}
});

test('native platform: libc cannot authorize an unsupported operating system', () => {
	// Replacing the Linux predicate with true passes the old supported-target
	// checks; a valid libc must not make an unsupported OS look supported.
	for (const platform of ['freebsd', 'openbsd', 'sunos', 'aix', 'android', 'Linux', 'linux ', '']) {
		for (const arch of ['arm64', 'x64']) {
			for (const libc of [undefined, 'gnu', 'musl']) {
				assert.throws(() => nativePlatform(platform, arch, libc), /Unsupported native platform:/,
					`${platform}/${arch}/${libc}`);
			}
		}
	}
});

test('native platform: rejects unsupported architectures on every platform', () => {
	for (const platform of ['darwin', 'win32', 'linux', 'freebsd']) {
		for (const arch of ['', 'ia32', 'arm', 'riscv64', 'x86_64', 'ARM64', 'X64', 'arm64 ', ' x64']) {
			for (const libc of [undefined, 'gnu', 'musl']) {
				assert.throws(() => nativePlatform(platform, arch, libc), {
					name: 'Error', message: `Unsupported native architecture: ${arch}`,
				});
			}
		}
	}
});

test('native platform: Linux requires an exact supported libc identifier', () => {
	for (const arch of ['arm64', 'x64']) {
		for (const libc of [undefined, '', 'glibc', 'GNU', 'Musl', 'gnu ', ' musl', 'msvc']) {
			assert.throws(() => nativePlatform('linux', arch, libc), /Unsupported native platform:/,
				`linux/${arch}/${libc}`);
		}
	}
});

test('native platform: Darwin and Windows suffixes do not depend on libc', () => {
	for (const [platform, arch, , expected] of supported.filter(([os]) => os !== 'linux')) {
		for (const libc of [undefined, '', 'gnu', 'musl', 'other']) {
			assert.equal(nativePlatform(platform, arch, libc), expected);
		}
	}
});

test('native platform: diagnostics identify the rejected input and omit absent libc', () => {
	for (const [args, message] of [
		[['linux', 'arm64'], 'Unsupported native platform: linux-arm64'],
		[['linux', 'x64', ''], 'Unsupported native platform: linux-x64'],
		[['linux', 'x64', 'glibc'], 'Unsupported native platform: linux-x64-glibc'],
		[['freebsd', 'arm64', 'musl'], 'Unsupported native platform: freebsd-arm64-musl'],
		[['freebsd', 'x64'], 'Unsupported native platform: freebsd-x64'],
		[['freebsd', 'riscv64', 'musl'], 'Unsupported native architecture: riscv64'],
	]) assert.throws(() => nativePlatform(...args), { name: 'Error', message });
});
