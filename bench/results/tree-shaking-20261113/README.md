# Tree-shaking the HTML entity table

Baseline: `65e2e6391aab5e288875697f3c46bb5281f87057` (the verified escapex 0.0.1
candidate). The candidate changes only table initialization from `Array(63).fill`
and five assignments to a 63-entry array literal. Empty entries and the five
entity strings have the same indices; scanning algorithms are unchanged.

## Bundle size

Measured with Node 24.22.2, Rolldown 1.3.0 and Vite 8.3.6, using the project's
browser bundle configuration and installed npm tarballs. Generated line comments
containing source paths are removed before measuring so temporary directory names
do not affect the result. Vite's library output retains whitespace; the two tools'
absolute sizes should not be compared as equivalent minification settings.

| Import | Rolldown before / after (gzip bytes) | Vite before / after (gzip bytes) |
|---|---:|---:|
| `escapeHTML` | 583 / 582 | 681 / 678 |
| `escapeText` | 383 / 331 | 429 / 373 |
| `escapeAttribute` | 393 / 341 | 439 / 383 |
| `unescapeHTML` | 294 / 241 | 319 / 262 |
| All public functions | 874 / 877 | 995 / 994 |

The benefit is in single-function consumers that do not need the HTML entity
table. Importing all functions increases Rolldown gzip output by 3 bytes.
[sizes-before.json](sizes-before.json) and [sizes-after.json](sizes-after.json)
also retain raw and Brotli sizes.

After building JS/Wasm, reproduce the current package measurement with:

```sh
node bench/results/tree-shaking-20261113/measure-sizes.mjs
```

Set `RELEASE_CANDIDATE_DIR` to an extracted 0.0.1 release-candidate directory to
measure the baseline tarball with the same measurement script and bundlers.
The baseline comes from Release run `43431539564`, artifact `14042060197`.

## Correctness and regression checks

TypeScript/Rust checks, JS/Wasm tests, native tests, packed declarations,
browser/SSR bundles, documentation examples and release validation pass locally.
Six single-function size-budget checks (three functions in each bundler) pass for
the candidate and fail against the baseline release tarball. The budgets exclude
host-specific source-path comments and leave room for small minifier differences.

## Runtime protocol

Apple M2, macOS ARM64, Node 24.22.2. The existing `bench/library/run.mjs` harness
uses 25 unchanged competitor fixtures, fresh processes per variant and round,
rotated variant order, and consumes output with `Buffer.byteLength`. Each case
warms up for at least 100 ms and measures for at least 300 ms. Initialization is
excluded. Each comparison has three rounds per variant (six processes).

The baseline `dist/index.mjs` and `dist/escape-core.mjs` were copied from the clean
baseline checkout into `target/tree-shaking/before/`. An empty `native/` directory
satisfies the harness's shared binary-inventory step. Source and protocol hashes,
individual samples and medians are retained in the runtime JSON files.

```sh
LIBRARY_APIS='{"before":"target/tree-shaking/before/index.mjs","after":"dist/index.mjs"}' \
LIBRARY_VARIANTS=before,after LIBRARY_ROUNDS=3 \
LIBRARY_OUTPUT=target/tree-shaking/runtime.json node bench/library/run.mjs
```

## Runtime results and review status

| Measurement | First comparison | Repeat comparison |
|---|---:|---:|
| Geometric mean of 25 per-case median ratios | +0.46% | +2.09% |
| `first-31` | +14.11% | +6.55% |
| `two-far-31` | +32.28% | +0.28% |
| `first-32` | -3.56% | +39.57% |
| `unchanged-long` | +4.77% | +29.82% |

Positive values mean the candidate took longer. These are local microbenchmarks,
not end-to-end application measurements. The first large outlier did not repeat,
and other cases varied substantially, including a no-match case that never reads
the table. These measurements do not establish either a consistent regression or
runtime neutrality. This remains a draft optimization pending more controlled
runtime validation; it should not be described as a speed improvement.

Both [runtime.json](runtime.json) and [runtime-repeat.json](runtime-repeat.json)
retain every measured sample. The shipped 0.0.1 candidate is unchanged by this
branch; merging and publication are separate decisions.
