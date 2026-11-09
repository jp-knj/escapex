import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		wasm: 'src/wasm.ts',
	},
	format: 'esm',
	platform: 'neutral',
	target: 'es2022',
	dts: { generator: 'oxc' },
	clean: true,
	outExtensions: () => ({ js: '.mjs', dts: '.d.mts' }),
	deps: { neverBundle: [/^node:/] },
});
