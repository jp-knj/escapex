# Mutation testing

Run `npm ci` and `npm run test:mutation` with Node 24.11 or newer. Stryker 10.1.1
mutates `src/escape.ts` and `src/unescape.ts`, rebuilds JavaScript in an isolated
sandbox, and runs the ESM tests against that build. The command runner first runs
`test/escape-contract.test.mjs`, then runs `test/escape-html.test.mjs` only if the
focused checks pass. Per-test coverage is disabled. Both files also run in the
normal unit suite on every supported CI platform.

The focused checks use literal expected outputs for short/long scans, target
spacing, clean suffixes, context-specific characters, and exact single-pass
decoding. Two-target HTML inputs run first: reversing a scan's loop condition
returns incorrect output for these inputs, while a single-target input can
loop indefinitely. Stopping after a failed focused test preserves that
assertion failure instead of subsequently timing out in the exhaustive suite.
No timing assertion or private scan-threshold assertion is added.

The mutation build disables declaration output and tsconfig loading. Stryker's
tsconfig rewriter uses a compiler API absent from TypeScript 7; the bundler's
explicit ES2022 target needs no tsconfig aliases. Normal type and declaration
checks still run separately in CI.

Open `target/mutation/index.html` for annotated source and surviving mutants.
`target/mutation/mutation.json` contains the machine-readable results. Both are
also uploaded by the mutation CI workflow.

Run `npm run --silent test:mutation:summary` for counts, scores with and without
timeouts, and survivor locations. To compare two reports, use
`npm run --silent test:mutation:summary -- current.json previous.json`.
The comparison rejects different production source or mutant sets.

The [initial before/after measurement](../../bench/results/mutation-20261122/README.md)
records the exact faults detected by the expanded tests and the remaining
performance-related survivors.

This measures the ESM suite's ability to detect the generated faults. It does
not mutate Rust, native loading, or the Wasm wrapper. Cross-platform functional
tests remain separate. A larger assertion count does not by itself imply a
higher mutation score.

Inspect survivors before changing tests: a changed search threshold can select
a different correct algorithm without changing output. Timeouts are reported
separately from test failures. The initial integration reports the unfiltered
score without imposing an arbitrary percentage gate or suppressing survivors.

Configuration follows the [Stryker command-runner documentation](https://stryker-mutator.io/docs/stryker-js/configuration/#testrunner-string).
