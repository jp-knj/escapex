import { readFile } from 'node:fs/promises';

export const variants = ['esm', 'wasm', 'native-scalar', 'native'];
export const moduleUrl = (variant) => new URL(variant === 'native-scalar'
	? '../target/native-scalar-api/native.mjs'
	: `../dist/${variant === 'esm' ? 'index' : variant}.mjs`, import.meta.url);

export async function loadImplementation(variant) {
	if (!variants.includes(variant)) throw new Error(`Unknown implementation: ${variant}`);
	const api = await import(moduleUrl(variant));
	if (variant === 'wasm') await api.init(await readFile(new URL('../dist/escape_html.wasm', import.meta.url)));
	return api;
}
