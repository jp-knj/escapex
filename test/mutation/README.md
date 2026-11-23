# Mutation testing

Run `npm ci` and `npm run test:mutation` with Node 24.11 or newer. Stryker 10.1.1
mutates `src/escape.ts`, `src/unescape.ts`, and `src/native-platform.ts` in an
isolated sandbox. Escaping tests use the rebuilt JavaScript; platform-selection
tests import the instrumented TypeScript source directly, without a native
binary. The command runner first runs `test/escape-contract.test.mjs` and
`test/native-platform.test.mjs`, then runs `test/escape-html.test.mjs` only if
the focused checks pass. Per-test coverage is disabled. All three files also
run in the normal unit suite on every supported CI platform.

The focused checks use literal expected outputs for short/long scans, target
spacing, clean suffixes, context-specific characters, and exact single-pass
decoding. Two-target HTML inputs run first: reversing a scan's loop condition
returns incorrect output for these inputs, while a single-target input can
loop indefinitely. Stopping after a failed focused test preserves that
assertion failure instead of subsequently timing out in the exhaustive suite.
No timing assertion or private scan-threshold assertion is added.

The platform tests check all eight package suffixes, unsupported OS/architecture
combinations, exact Linux libc identifiers, and error diagnostics. In particular,
an unsupported OS paired with `gnu` or `musl` must still be rejected. These tests
run independently with `node --test test/native-platform.test.mjs` and require
no Rust build. They cover package-name selection, not host libc detection.

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

This measures the suites' ability to detect faults in escaping, decoding, and
native package-name selection. It does not mutate Rust, native loading, libc
detection, or the Wasm wrapper. Cross-platform functional tests remain separate.
A larger assertion count does not by itself imply a higher mutation score.
When comparing with older reports that cover only escaping/decoding, inspect
those two files separately: adding a mutation target changes the denominator.

Inspect survivors before changing tests: a changed search threshold can select
a different correct algorithm without changing output. Timeouts are reported
separately from test failures. The initial integration reports the unfiltered
score without imposing an arbitrary percentage gate or suppressing survivors.

Configuration follows the [Stryker command-runner documentation](https://stryker-mutator.io/docs/stryker-js/configuration/#testrunner-string).
