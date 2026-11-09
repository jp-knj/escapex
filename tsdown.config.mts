import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		wasm: 'src/wasm.ts',
		native: 'src/native.ts',
	},
	format: 'esm',
	platform: 'neutral',
	target: 'es2022',
	dts: { generator: 'oxc' },
	clean: true,
	outExtensions: () => ({ js: '.mjs', dts: '.d.mts' }),
	deps: { neverBundle: [/^node:/] },
	// The default API and native short-string path share the exact same JS code.
	outputOptions: { chunkFileNames: '[name].mjs', codeSplitting: {
		groups: [{ name: 'escape-core', test: /[\\/]src[\\/](?:index|escape|unescape)\.ts$/ }],
	} },
});
