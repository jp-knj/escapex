export const targets = [
	{ id: 'darwin-arm64', triple: 'aarch64-apple-darwin', os: 'darwin', cpu: 'arm64' },
	{ id: 'darwin-x64', triple: 'x86_64-apple-darwin', os: 'darwin', cpu: 'x64' },
	{ id: 'linux-arm64-gnu', triple: 'aarch64-unknown-linux-gnu', os: 'linux', cpu: 'arm64', libc: 'glibc' },
	{ id: 'linux-x64-gnu', triple: 'x86_64-unknown-linux-gnu', os: 'linux', cpu: 'x64', libc: 'glibc' },
	{ id: 'linux-arm64-musl', triple: 'aarch64-unknown-linux-musl', os: 'linux', cpu: 'arm64', libc: 'musl' },
	{ id: 'linux-x64-musl', triple: 'x86_64-unknown-linux-musl', os: 'linux', cpu: 'x64', libc: 'musl' },
	{ id: 'win32-arm64-msvc', triple: 'aarch64-pc-windows-msvc', os: 'win32', cpu: 'arm64' },
	{ id: 'win32-x64-msvc', triple: 'x86_64-pc-windows-msvc', os: 'win32', cpu: 'x64' },
];
