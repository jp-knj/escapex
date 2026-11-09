# Native hardware validation — 2026-11-10

Historical measurement caveat: these Astro runs reused a Container whose route
table grew on every render. Their timings and memory figures do not establish
steady render costs. The follow-up harness creates one Container per render,
including creation in the timed region. Correctness and microbenchmark results
are unaffected. The failed thresholds below describe the original measurement,
not a confirmed regression in a fixed-size rendering workload.

All 24 native matrix jobs passed: eight target packages on Node.js 22, 24 and
26. NEON ran on ARM64; both SSE2 and AVX2 ran on every x86-64 target. The
existing ESM/Wasm, bundler, declaration and Chromium/Firefox/WebKit checks also
passed. Eight platform npm tarballs were built and archived without publishing.

The performance criterion was **not met across all targets**: the macOS ARM64
with-vitest example took 6.93% more time, and the macOS Intel portfolio Hero
example took 10.94% more time. All large-props cases took at least 5% less time.
These results do not support a general native-speedup claim.

- Tested source: [`2faf59f`](https://github.com/jp-knj/html-escape/commit/2faf59f841ddc6c9af2583715aa06cb96f91e37d).
- [Native workflow](https://github.com/jp-knj/html-escape/actions/runs/42749236198): 25 successful jobs, including the shared Wasm build.
- [Existing CI workflow](https://github.com/jp-knj/html-escape/actions/runs/42749235970): four successful jobs.
- [Workflow/job/artifact manifest](workflows.json). Environment JSON, Rust output and benchmark JSON are preserved in each target/Node directory below. Saved Rust logs normalize line endings and trim trailing whitespace.

## Runtime matrix

These GitHub-hosted machines execute the relevant architecture natively; they
are virtualized runners, not a claim of dedicated bare-metal measurement.
Alpine runs in a same-architecture Docker container. Node architecture, Rust
host target and libc were checked before testing. Linux ARM64 reports its CPU
model as `unknown`; the evidence does not identify the underlying chip.

| Target / Node 24 evidence | CPU model in Node 24 | Node 22 | Node 24 | Node 26 | Direct SIMD tests |
| --- | --- | --- | --- | --- | --- |
| [darwin-arm64](darwin-arm64-node24/native-environment.json) | Apple M1 (Virtual) | 22.23.4 | 24.22.2 | 26.13.0 | NEON |
| [darwin-x64](darwin-x64-node24/native-environment.json) | Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz | 22.23.2 | 24.19.0 | 26.13.0 | SSE2, AVX2 |
| [linux-arm64-gnu](linux-arm64-gnu-node24/native-environment.json) | unknown | 22.23.4 | 24.22.2 | 26.13.0 | NEON |
| [linux-arm64-musl](linux-arm64-musl-node24/native-environment.json) | unknown | 22.23.4 | 24.22.2 | 26.13.0 | NEON |
| [linux-x64-gnu](linux-x64-gnu-node24/native-environment.json) | Intel(R) Xeon(R) 6973P-C | 22.23.4 | 24.22.2 | 26.13.0 | SSE2, AVX2 |
| [linux-x64-musl](linux-x64-musl-node24/native-environment.json) | AMD EPYC 9V74 80-Core Processor | 22.23.4 | 24.22.2 | 26.13.0 | SSE2, AVX2 |
| [win32-arm64-msvc](win32-arm64-msvc-node24/native-environment.json) | Cobalt 100 | 22.23.4 | 24.22.2 | 26.13.0 | NEON |
| [win32-x64-msvc](win32-x64-msvc-node24/native-environment.json) | AMD EPYC 9V74 80-Core Processor | 22.23.4 | 24.22.2 | 26.13.0 | SSE2, AVX2 |

Rust 1.91.1 was used throughout. Rust tests cover every UTF-16 value, every
16-lane match mask, boundaries, dense matches and large inputs. Node tests
cover all public functions, lone surrogates, exact TypeErrors, Workers, ESM
imports from installed npm tarballs, declarations, and missing/corrupt addons.
All matrix jobs also run the existing unit and package tests. The standalone
CI workflow covers bundlers and all three browser engines.

The first CI attempt exposed an npm 11 clean-install lockfile issue for the
unpublished optional packages. The source lockfile now resolves them to local
platform directories, while the root package manifest retains exact registry
versions for publication. The successful runs linked above include this fix.

## Astro response collection

Each value below compares native SIMD with ESM on the **same runner** using
the median of three independent process means. Negative values mean less time.
The timed region includes `renderToResponse()`, string transfers and
`Response.text()`. Astro is pinned to 7.4.8. All output hashes match across
variants and rounds. Node patch versions differ on macOS Intel, as recorded
above; absolute times across these hosts are not a controlled CPU comparison.

| Target | Large props | Portfolio Hero | with-vitest | All three criteria |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -25.41% | -12.96% | +6.93% | **Not met** |
| darwin-x64 | -12.68% | +10.94% | -7.01% | **Not met** |
| linux-arm64-gnu | -21.82% | +0.86% | -1.10% | Pass |
| linux-arm64-musl | -8.73% | -0.31% | -3.48% | Pass |
| linux-x64-gnu | -14.65% | +2.30% | -3.66% | Pass |
| linux-x64-musl | -6.11% | +2.69% | -1.33% | Pass |
| win32-arm64-msvc | -34.25% | +3.32% | +0.87% | Pass |
| win32-x64-msvc | -15.33% | +0.55% | +0.29% | Pass |

The thresholds are at least 5% less time for large props and no more than 5%
more time for either official short example. Both macOS targets miss one
short-example threshold. Three runs are an acceptance sample, not a confidence
interval; no extra runs were selected to replace these failures. Performance
thresholds are reported in JSON and do not turn correctness jobs red.

Raw Astro JSON includes all four variants (ESM, Wasm, native scalar and native
SIMD), every sample, the first complete render, cold imports and memory.
The neighboring microbenchmark JSON includes short strings, unchanged strings,
quoted JSON, Japanese/emoji, sparse markup and dense quotes for every operation.

## Startup and memory

Cold API import is the median of nine fresh processes per variant (three
scenarios times three rounds). Peak RSS is the median of the three large-props
process peaks, including the full Astro runtime. It is not native allocation
usage alone. Post-GC RSS, heap and external memory remain available in raw JSON.

| Target | ESM import ms | Native import ms | ESM peak RSS MiB | Native peak RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| darwin-arm64 | 0.644 | 3.691 | 398.14 | 445.84 |
| darwin-x64 | 0.972 | 6.192 | 305.19 | 299.37 |
| linux-arm64-gnu | 0.736 | 6.252 | 336.80 | 356.86 |
| linux-arm64-musl | 1.547 | 9.016 | 332.52 | 347.57 |
| linux-x64-gnu | 0.639 | 5.161 | 337.93 | 359.48 |
| linux-x64-musl | 1.334 | 6.643 | 331.75 | 335.99 |
| win32-arm64-msvc | 1.043 | 7.813 | 302.99 | 310.33 |
| win32-x64-msvc | 0.718 | 4.474 | 312.21 | 326.50 |

See the [benchmark methodology](../../README.md) for reproduction commands and
limits, and the [initial local Apple M2 results](../README.md) for a separate
run on a different host. No direct ox-content timing comparison was performed.
