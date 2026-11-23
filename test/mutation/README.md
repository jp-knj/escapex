# Mutation testing

Run `npm ci` and `npm run test:mutation` with Node 24.11 or newer. Stryker 10.1.1
mutates `src/escape.ts`, `src/unescape.ts`, `src/native-platform.ts`,
`src/native-libc.ts`, and `src/wasm.ts` in an isolated sandbox. Escaping and Wasm
wrapper tests use rebuilt JavaScript; platform/libc tests import instrumented
TypeScript directly, without a native binary. The command runner first runs the
escape, platform, libc, and Wasm contract tests, then runs
`test/escape-html.test.mjs` only if those checks pass. Per-test coverage is
disabled. These tests also run in the normal unit suite on every CI platform.

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

The libc tests inject report/filesystem callbacks into the internal detector.
They exercise glibc precedence, musl detection through ldd or shared objects,
exceptions from either callback, incomplete reports, and unknown environments
on any host. Native loading still uses the real Node APIs.

The Wasm contract tests stub instantiation and ABI return values, using real
`WebAssembly.Memory` objects. They cover each missing or mistyped export,
initialization failures and retries, signed/unsigned error sentinels, error
types/messages, recovery after allocation failure, memory growth, and UTF-16
decoding. Literal input/output expectations keep the fixture independent of
the encoders. Input-memory comparisons stop at the first differing code unit;
formatting a large array diff must not turn an assertion failure into a timeout.
The regular unit suite additionally exercises the actual scalar
and optimized Wasm binaries. No large allocation is needed to test exhaustion.

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

This measures faults in escaping, decoding, native package-name selection,
libc detection, and the Wasm JavaScript wrapper. It does not mutate Rust or the
native binary loader. Cross-platform functional tests remain separate.
A larger assertion count does not by itself imply a higher mutation score.
When comparing with older reports that cover only escaping/decoding, inspect
those two files separately: adding a mutation target changes the denominator.

Inspect survivors before changing tests: a changed search threshold can select
a different correct algorithm without changing output. Timeouts are reported
separately from test failures. The initial integration reports the unfiltered
score without imposing an arbitrary percentage gate or suppressing survivors.

Configuration follows the [Stryker command-runner documentation](https://stryker-mutator.io/docs/stryker-js/configuration/#testrunner-string).
