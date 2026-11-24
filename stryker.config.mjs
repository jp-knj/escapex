export default {
	mutate: ['src/escape.ts', 'src/unescape.ts', 'src/native-platform.ts', 'src/native-libc.ts', 'src/native-loader.ts', 'src/wasm.ts'],
	testRunner: 'command',
	// A failed focused assertion must stop the command before an exhaustive
	// fixture reaches a different input on which the same mutant never returns.
	// Four mutation workers already run concurrently. Avoid another layer of
	// parallel test-file processes competing with exhaustive tests for CPU time.
	commandRunner: { command: 'node --test --test-concurrency=1 test/escape-contract.test.mjs test/native-platform.test.mjs test/native-libc.test.mjs test/native-loader.test.mjs test/wasm-contract.test.mjs && node --test test/escape-html.test.mjs' },
	// Build the instrumented source inside Stryker's sandbox. Testing the
	// workspace's existing dist would silently test unmutated code instead.
	buildCommand: 'npm run build:js -- --config tsdown.mutation.config.mts',
	coverageAnalysis: 'off',
	concurrency: 4,
	// Equivalent scanner mutants may complete exhaustive fixtures slowly under
	// CPU contention. Leave headroom rather than scoring that delay as a fault.
	timeoutMS: 20000,
	// TS 7 no longer exports the compiler API used by Stryker's tsconfig
	// rewriter. Our bundler config sets its target explicitly and needs no
	// path aliases; mutation builds can skip tsconfig and declaration output.
	ignorePatterns: ['bench', 'dist', 'target', '.github', 'npm', 'src/rust', 'tsconfig.json'],
	tempDirName: 'target/stryker-tmp',
	reporters: ['clear-text', 'progress', 'html', 'json'],
	clearTextReporter: { logTests: false, logMutants: false },
	allowConsoleColors: false,
	htmlReporter: { fileName: 'target/mutation/index.html' },
	jsonReporter: { fileName: 'target/mutation/mutation.json' },
};
