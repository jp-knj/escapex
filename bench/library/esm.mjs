// The shared short scanner also serves the default ESM entry.
process.env.LIBRARY_APIS = JSON.stringify({
	'esm-before': 'target/library-tuning/before-api/index.mjs',
	esm: 'dist/index.mjs',
});
process.env.LIBRARY_VARIANTS = 'esm-before,esm';
process.env.LIBRARY_ROUNDS = '3';
process.env.LIBRARY_OUTPUT = 'target/library-tuning/results/esm.json';
await import('./run.mjs');
