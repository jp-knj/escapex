import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface NativeBinding {
	escapeHtml(value: string): string;
	escapeText(value: string): string;
	escapeAttribute(value: string): string;
	unescapeHtml(value: string): string;
}

/** Internal: resolve relative to the entry point, preferring a checkout binary. */
export function loadNativeBinding(id: string, moduleURL: string): NativeBinding {
	const require = createRequire(moduleURL);
	const local = new URL(`./native/escape_html.${id}.node`, moduleURL);
	const packageName = `escapex-${id}`;
	try {
		if (existsSync(local)) return require(fileURLToPath(local));
		// Resolve from the opt-in package so nested dependency layouts work too.
		const nativeRequire = createRequire(require.resolve('escapex-native/package.json'));
		return nativeRequire(packageName);
	} catch (cause) {
		throw new Error(`Cannot load escapex/native for ${id}. Run npm install escapex escapex-native with matching versions and optional dependencies enabled (requires ${packageName}), or run npm run build:native in the source checkout.`, { cause });
	}
}
