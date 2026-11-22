export default {
	mutate: ['src/escape.ts', 'src/unescape.ts'],
	testRunner: 'command',
	commandRunner: { command: 'node --test test/escape-html.test.mjs' },
	// Build the instrumented source inside Stryker's sandbox. Testing the
	// workspace's existing dist would silently test unmutated code instead.
	buildCommand: 'npm run build:js -- --config tsdown.mutation.config.mts',
	coverageAnalysis: 'off',
	concurrency: 4,
	timeoutMS: 10000,
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
