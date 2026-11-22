# Mutation testing

Run `npm ci` and `npm run test:mutation` with Node 24.11 or newer. Stryker 10.1.1
mutates `src/escape.ts` and `src/unescape.ts`, rebuilds JavaScript in an isolated
sandbox, and runs the existing ESM tests against that build. The command runner
executes the whole selected suite for each mutant; per-test coverage is disabled.

Open `target/mutation/index.html` for annotated source and surviving mutants.
`target/mutation/mutation.json` contains the machine-readable results. Both are
also uploaded by the mutation CI workflow.

This measures the ESM suite's ability to detect the generated faults. It does
not mutate Rust, native loading, or the Wasm wrapper. Cross-platform functional
tests remain separate. A larger assertion count does not by itself imply a
higher mutation score.

Inspect survivors before changing tests: a changed search threshold can select
a different correct algorithm without changing output. Timeouts are reported
separately from test failures. The initial integration reports the unfiltered
score without imposing an arbitrary percentage gate or suppressing survivors.

Configuration follows the [Stryker command-runner documentation](https://stryker-mutator.io/docs/stryker-js/configuration/#testrunner-string).
