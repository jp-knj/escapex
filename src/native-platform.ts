/** Kept free of Node APIs so package selection can be checked on every host. */
export function nativePlatform(platform: string, arch: string, libc?: string): string {
	if (arch !== 'arm64' && arch !== 'x64') throw new Error(`Unsupported native architecture: ${arch}`);
	if (platform === 'darwin') return `${platform}-${arch}`;
	if (platform === 'win32') return `${platform}-${arch}-msvc`;
	if (platform === 'linux' && (libc === 'gnu' || libc === 'musl')) return `${platform}-${arch}-${libc}`;
	throw new Error(`Unsupported native platform: ${platform}-${arch}${libc ? `-${libc}` : ''}`);
}
