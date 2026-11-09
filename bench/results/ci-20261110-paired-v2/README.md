# Native validation with paired v2 measurements — 2026-11-10

The paired steady-render thresholds passed on **8 of eight targets** on Node 24.
Correctness was tested separately on all eight targets with Node 22, 24 and 26.
The performance result applies to these fixtures, runtime versions and hosted
machines; it is not a guarantee for every input or machine. Performance on
Node 22 and 26 was not measured in this run.

- Source: [`7ba356c`](https://github.com/jp-knj/html-escape/commit/7ba356c34abb59b6e977e9ba574fde4123d0ed94).
- [Native workflow](https://github.com/jp-knj/html-escape/actions/runs/42755101813).
- [Existing ESM/Wasm/browser CI](https://github.com/jp-knj/html-escape/actions/runs/42755101756).
- [Workflow, job and artifact manifest](workflows.json).

The production change combines the existing JavaScript path for inputs shorter
than 256 UTF-16 units with a Rust writer that reserves the known remaining
minimum output and emits constant-sized entity copies. Production API code is
unchanged from `6fa439c`. This run changes the measurement protocol: it retains
within-process pairing, increases independent runs to nine, and requires a
minimum warmup count. Earlier failures remain in the
[three-process output-optimization report](../ci-20261110-output/README.md).

## Paired steady rendering

Each scenario uses nine independent processes. Within each process, all four
public APIs share a warmed Astro runtime, rotate through eight balanced
500 ms blocks, and create a fresh Container for every render. Container creation,
string conversions and `Response.text()` are included. Each implementation
warms for at least one second and 100 large renders or 10,000 short renders.
The statistic is the median of nine within-process native/ESM changes, after
taking each implementation’s median block time within a process. The original
three-process isolated protocol is also reported below.

Negative values mean less time than ESM. The thresholds remain at most -5%
for large props and at most +5% for each short official example.

| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -25.91% | -2.20% | +4.9987% | Pass |
| darwin-x64 | -13.32% | +1.98% | +0.45% | Pass |
| linux-arm64-gnu | -22.00% | -0.15% | +2.38% | Pass |
| linux-arm64-musl | -11.27% | +0.96% | +0.79% | Pass |
| linux-x64-gnu | -15.44% | -0.85% | -0.35% | Pass |
| linux-x64-musl | -6.30% | -0.65% | -0.15% | Pass |
| win32-arm64-msvc | -33.91% | +0.75% | +0.68% | Pass |
| win32-x64-msvc | -19.60% | +0.59% | -0.80% | Pass |

All hashes match across implementations and rounds for each scenario. The
raw JSON retains all 27 processes, 864 timed blocks, 108 warmups and the nine
paired ratios per scenario for each target. No failed sample was removed.
This is an acceptance check, not a confidence interval.

The macOS ARM64 with-vitest estimate is **+4.998692%**, only about 0.0013
percentage points inside the +5% limit. Individual process changes range from
-9.29% to +16.82%. This narrowly satisfies the specified point-estimate gate;
it does not establish a robust margin against regressions or runner variation.

The comparison is the complete native API versus ESM. It does not attribute
the entire improvement to SIMD: native scalar shares the wrapper, UTF-16
transfers and optimized writer. All four variants are retained in the raw data.

## Isolated-process comparison

These measurements use three independent processes per implementation and
scenario, with 400 ms warmup and 1,200 ms timed rendering. Their medians are
calculated independently. They retain startup and memory evidence, but are
more exposed to differences between process JIT states and host load. A paired
pass does not turn an isolated failure into a pass.

| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -22.34% | +21.41% | -5.55% | **Not met** |
| darwin-x64 | -26.38% | +2.25% | -3.86% | Pass |
| linux-arm64-gnu | -21.96% | +1.55% | -6.93% | Pass |
| linux-arm64-musl | -13.64% | -2.63% | -0.78% | Pass |
| linux-x64-gnu | -19.96% | -1.40% | +1.40% | Pass |
| linux-x64-musl | -10.86% | +0.83% | -2.57% | Pass |
| win32-arm64-msvc | -34.91% | +0.17% | +1.57% | Pass |
| win32-x64-msvc | -21.05% | +1.15% | +1.06% | Pass |

## Startup and memory

API import times are medians of the nine isolated workers per implementation.
Peak RSS and post-GC JS heap are medians of the three large-props workers, in
MiB. RSS covers the whole process, including Astro and retained allocator pages.
The raw JSON also includes first complete render, Astro runtime import, external
memory and the Wasm/scalar variants. Paired-process memory is not used here.

| Target | API import ESM/native ms | Peak RSS ESM/native MiB | JS heap ESM/native MiB |
| --- | ---: | ---: | ---: |
| darwin-arm64 | 0.92 / 4.50 | 388.03 / 411.36 | 13.87 / 12.86 |
| darwin-x64 | 2.49 / 12.57 | 230.04 / 244.62 | 13.78 / 14.03 |
| linux-arm64-gnu | 1.06 / 6.20 | 334.88 / 356.02 | 12.64 / 12.94 |
| linux-arm64-musl | 1.79 / 7.79 | 332.18 / 351.23 | 12.82 / 12.85 |
| linux-x64-gnu | 1.11 / 6.36 | 334.06 / 351.62 | 12.85 / 13.13 |
| linux-x64-musl | 1.59 / 8.28 | 330.12 / 328.38 | 14.15 / 13.04 |
| win32-arm64-msvc | 1.81 / 8.57 | 304.46 / 311.96 | 13.61 / 12.96 |
| win32-x64-msvc | 1.56 / 6.09 | 312.74 / 325.89 | 12.89 / 13.29 |

## Machines and correctness

Hosted runners execute ARM64 or x86-64 instructions natively, including the
Alpine containers on matching Linux hosts. They are virtualized environments,
not QEMU CPU emulation or dedicated, controlled bare-metal machines.
Every x86-64 Rust log exercises both SSE2 and AVX2; every ARM64 log exercises
NEON, alongside scalar and runtime dispatch. All six exhaustive Rust tests
passed in every target/Node combination. Node tests cover package tarballs,
TypeScript declarations, every public export, UTF-16 preservation, loader
errors and concurrent Workers. Existing ESM/Wasm and browser results are
recorded in the linked CI workflow.

| Target | Reported CPU | Node for benchmarks | OS release |
| --- | --- | --- | --- |
| darwin-arm64 | Apple M1 (Virtual) | v24.22.2 | 24.6.0 |
| darwin-x64 | Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz | v24.19.0 | 24.6.0 |
| linux-arm64-gnu | unknown | v24.22.2 | 6.8.0-1070-azure |
| linux-arm64-musl | unknown | v24.22.2 | 7.0.0-1017-azure |
| linux-x64-gnu | AMD EPYC 7763 64-Core Processor | v24.22.2 | 6.8.0-1070-azure |
| linux-x64-musl | AMD EPYC 7763 64-Core Processor | v24.22.2 | 7.0.0-1017-azure |
| win32-arm64-msvc | Cobalt 100 | v24.22.2 | 10.0.26200 |
| win32-x64-msvc | AMD EPYC 7763 64-Core Processor | v24.22.2 | 10.0.20348 |

Each target/Node directory contains its environment and Rust test log. Node 24
directories also contain all API and Astro benchmark samples. Rust log line
endings and trailing whitespace are normalized; JSON data is copied unchanged.
API cold import and memory are recorded, not included in the steady-render gate.
No release or npm publication was performed.

See [reproduction and methodology](../../README.md),
[local measurements](../local-20261110-output/README.md), and the
[comparison with other escaping libraries](../competitors-20261110-output/README.md).
