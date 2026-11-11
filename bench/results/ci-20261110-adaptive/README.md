# Adaptive native validation — 2026-11-10

The paired rendering criterion passed on seven of eight targets. macOS Intel
large props improved by only 0.77%, missing the required 5% reduction.
Each scenario was measured in three independent processes, using a fixed
balanced order within each process. All 24 correctness jobs (Node 22/24/26)
and the four existing CI jobs passed, including all three browser engines.
The Native workflow failed its macOS Intel performance gate; correctness passed.

This is **not a completed performance objective**. The isolated-process
macOS ARM64 large-props measurement took 3.97% more time, while its paired
measurement took 24.60% less time. Both are preserved below. Hosted VM timing
varies; macOS Intel also failed both isolated short-example thresholds.
The failed measurements are retained while output writing is optimized further.

- [Tested source ac371f4](https://github.com/jp-knj/html-escape/commit/ac371f4f94fbd7053108fe0a4f72a6f3410eba8f).
- [Native CI and platform packages](https://github.com/jp-knj/html-escape/actions/runs/42751614488).
- [Existing CI](https://github.com/jp-knj/html-escape/actions/runs/42751614754).
- [Workflow/job/artifact manifest](workflows.json).

## Changes and measurement correction

Inputs shorter than 256 UTF-16 units use the exact JavaScript functions shared
with the default ESM API. Longer converted inputs use Rust with runtime SIMD
dispatch. The cutoff is independent of the input content and caller. Boundary
and full UTF-16 tests, Worker tests and npm-tarball tests cover both paths.

The initial Astro harness reused one Container. Astro 7.4.8 appends a route to
its manifest on every render, so the benchmark workload grew with iteration
count. The corrected shared harness creates one Container per render and times
its creation, rendering, string transfers and complete `Response.text()`.
Historical results remain available with this caveat. The intermediate
[run 42751087598](https://github.com/jp-knj/html-escape/actions/runs/42751087598)
was cancelled after identifying the harness defect; it supplies no acceptance
claim. The full corrected run above was executed once, without replacing any
failed samples with favorable reruns.

Both protocols use the same compiled fixtures and props, pinned Astro 7.4.8,
and exact output-hash checks. The paired protocol and threshold-failure exit
were defined before this run: one second of warmup per implementation, then
eight balanced cycles of four 500 ms blocks per independent process. The
isolated protocol retains cold imports, first renders and process memory.
See [methodology](../../README.md) for details.

## Paired comparison

Native SIMD API time versus ESM, percent; negative means less time. The
threshold is at most -5% for large props and at most +5% for each short example.

| Target | Large props | Portfolio Hero | with-vitest | Criterion |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -24.60% | +4.49% | -8.55% | Pass |
| darwin-x64 | -0.77% | -1.28% | -2.34% | **Not met** |
| linux-arm64-gnu | -22.81% | -1.35% | +0.14% | Pass |
| linux-arm64-musl | -11.46% | +0.42% | -0.89% | Pass |
| linux-x64-gnu | -14.34% | -0.25% | +0.94% | Pass |
| linux-x64-musl | -5.38% | +0.29% | -0.77% | Pass |
| win32-arm64-msvc | -33.12% | +0.95% | +2.81% | Pass |
| win32-x64-msvc | -18.18% | -0.66% | -0.30% | Pass |

## Isolated-process comparison

These results are retained alongside the paired gate. Each implementation runs
in its own fresh process per scenario and round.

| Target | Large props | Portfolio Hero | with-vitest | Criterion |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | +3.97% | -23.79% | -30.06% | **Not met** |
| darwin-x64 | -10.28% | +10.15% | +21.90% | **Not met** |
| linux-arm64-gnu | -20.96% | -8.55% | +0.71% | Pass |
| linux-arm64-musl | -11.80% | -1.15% | -0.89% | Pass |
| linux-x64-gnu | -15.92% | -0.57% | -0.21% | Pass |
| linux-x64-musl | -6.44% | +2.12% | -1.11% | Pass |
| win32-arm64-msvc | -31.70% | +0.85% | +1.69% | Pass |
| win32-x64-msvc | -15.09% | -1.40% | +0.32% | Pass |

On macOS ARM64, the isolated large-props ESM samples were 30.24, 18.22 and
19.92 ms; native samples were 29.38, 14.48 and 20.72 ms. A separate local
Apple M2 run passed all criteria in both protocols:
[local evidence](../local-20261110-adaptive/README.md). It does not erase the
hosted-runner failure.

## Hardware and runtime evidence

The runners execute ARM64 or x86-64 instructions natively; they are hosted
VMs, not dedicated bare-metal hosts. Alpine containers match their host
architecture. Node/Rust architecture and libc are asserted. CPU model `unknown`
is preserved where Linux ARM64 does not expose a model. Rust 1.91.1 is used
everywhere; all ARM targets directly test NEON and all x86-64 targets directly
test both SSE2 and AVX2.

| Target / Node 24 evidence | CPU | Node 22 | Node 24 | Node 26 |
| --- | --- | --- | --- | --- |
| [darwin-arm64](darwin-arm64-node24/native-environment.json) | Apple M1 (Virtual) | 22.23.4 | 24.22.2 | 26.13.0 |
| [darwin-x64](darwin-x64-node24/native-environment.json) | Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz | 22.23.2 | 24.19.0 | 26.13.0 |
| [linux-arm64-gnu](linux-arm64-gnu-node24/native-environment.json) | unknown | 22.23.4 | 24.22.2 | 26.13.0 |
| [linux-arm64-musl](linux-arm64-musl-node24/native-environment.json) | unknown | 22.23.4 | 24.22.2 | 26.13.0 |
| [linux-x64-gnu](linux-x64-gnu-node24/native-environment.json) | AMD EPYC 9V74 80-Core Processor | 22.23.4 | 24.22.2 | 26.13.0 |
| [linux-x64-musl](linux-x64-musl-node24/native-environment.json) | AMD EPYC 9V74 80-Core Processor | 22.23.4 | 24.22.2 | 26.13.0 |
| [win32-arm64-msvc](win32-arm64-msvc-node24/native-environment.json) | Cobalt 100 | 22.23.4 | 24.22.2 | 26.13.0 |
| [win32-x64-msvc](win32-x64-msvc-node24/native-environment.json) | AMD EPYC 9V74 80-Core Processor | 22.23.4 | 24.22.2 | 26.13.0 |

## Startup and memory

Cold API import is the median of nine isolated processes per variant. Peak RSS
is the median of three large-props process peaks, including Astro. These costs
are reported separately from the steady-render criterion. Raw JSON also retains
Wasm/scalar timings, first renders, post-GC memory, all microbenchmarks and all
paired blocks. Saved Rust logs normalize line endings and trailing whitespace.

| Target | ESM import ms | Native import ms | ESM peak RSS MiB | Native peak RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| darwin-arm64 | 1.501 | 4.811 | 390.67 | 396.23 |
| darwin-x64 | 1.851 | 8.283 | 266.68 | 242.69 |
| linux-arm64-gnu | 1.063 | 6.141 | 333.73 | 356.84 |
| linux-arm64-musl | 1.701 | 8.124 | 332.28 | 355.54 |
| linux-x64-gnu | 0.826 | 5.156 | 338.21 | 356.43 |
| linux-x64-musl | 1.623 | 8.343 | 330.68 | 331.50 |
| win32-arm64-msvc | 1.767 | 8.660 | 305.29 | 311.03 |
| win32-x64-msvc | 1.234 | 4.780 | 310.55 | 332.93 |

See also the [local comparison with other libraries](../competitors-20261110/README.md).
No release or npm publication was performed.
