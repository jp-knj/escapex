export default {
	mutate: ['src/escape.ts', 'src/unescape.ts'],
	testRunner: 'command',
	commandRunner: { command: 'node --test test/escape-html.test.mjs' },
	// Build the instrumented source inside Stryker's sandbox. Testing the
	// workspace's existing dist would silently test unmutated code instead.
	buildCommand: 'npm run build:js -- --no-dts',
	coverageAnalysis: 'off',
	concurrency: 4,
	timeoutMS: 10000,
	ignorePatterns: ['bench', 'dist', 'target', '.github', 'npm', 'src/rust'],
	tempDirName: 'target/stryker-tmp',
	reporters: ['clear-text', 'progress', 'html', 'json'],
	clearTextReporter: { logTests: false, logMutants: false },
	allowConsoleColors: false,
	htmlReporter: { fileName: 'target/mutation/index.html' },
	jsonReporter: { fileName: 'target/mutation/mutation.json' },
};
