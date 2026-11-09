# JavaScript search adoption — native hardware validation

Source [6339332](https://github.com/jp-knj/html-escape/commit/633933225dc4aa08a82602b8857a349272016748)
applies one global RegExp.test and a charCodeAt/switch scan from lastIndex - 1
to `escape` / `escapeHTML` inputs shorter than 32 UTF-16 units. The native
entry shares that JavaScript implementation. Longer ESM inputs keep regexp
searching; the native JS/Rust cutoff remains separately at 256 units.

- [Native workflow](https://github.com/jp-knj/html-escape/actions/runs/42766762034).
- [ESM/Wasm/browser workflow](https://github.com/jp-knj/html-escape/actions/runs/42766761794).
- [Workflow/job/artifact manifest](workflows.json).

Every target/Node directory records its environment, direct CPU instruction
tests and before/after API samples. Node 24 also includes the established
ESM/Wasm/native scalar/native SIMD microbenchmarks and both Astro protocols.
These are hosted ARM64/x86-64 machines, with native instruction execution;
Linux musl runs in Alpine on a matching host without CPU emulation.

## Before/after public API comparison

Each cell is current ESM time relative to the frozen 7ba356c ESM baseline for
the original 16-unit input `A < B & "quoted"`. Negative means less time.
Each implementation runs in three independent processes, with rotated order,
at least 100 ms warmup and 200 ms measured time per case. Short inputs require
at least 10,000 warmup calls. Every call consumes the output with
Buffer.byteLength. The statistic divides independent process medians; it is
not a paired estimate or confidence interval.

| Target | Node 22 | Node 24 | Node 26 |
| --- | ---: | ---: | ---: |
| darwin-arm64 | -29.57% | -33.73% | -0.54% |
| darwin-x64 | -12.74% | -9.37% | -15.48% |
| linux-arm64-gnu | -26.18% | -27.64% | -25.53% |
| linux-arm64-musl | -24.87% | -25.02% | -25.73% |
| linux-x64-gnu | -25.80% | -23.41% | -25.23% |
| linux-x64-musl | -24.23% | -18.50% | -18.28% |
| win32-arm64-msvc | -25.93% | -14.66% | -21.55% |
| win32-x64-msvc | -22.36% | -18.52% | -15.36% |

The same API suite deliberately retains less favorable input shapes. Below
are selected Node 24 changes; all 17 cases and every sample are in the JSON.

| Target | Unchanged 16 units | Leading target, 16 units | Leading target, 31 units | Leading target, 64 units | Sparse 8192 units |
| --- | ---: | ---: | ---: | ---: | ---: |
| darwin-arm64 | -12.38% | -6.66% | +56.95% | -4.42% | -6.29% |
| darwin-x64 | -21.27% | -10.41% | +58.36% | +5.75% | +2.50% |
| linux-arm64-gnu | -5.89% | +3.29% | +40.80% | -2.54% | -0.84% |
| linux-arm64-musl | -3.48% | +2.70% | +36.91% | -4.02% | -0.61% |
| linux-x64-gnu | +0.26% | +3.95% | +40.41% | -1.80% | +2.69% |
| linux-x64-musl | -1.22% | +4.07% | +35.70% | -4.95% | -0.40% |
| win32-arm64-msvc | -1.05% | +0.66% | +20.46% | +0.16% | -1.14% |
| win32-x64-msvc | -1.26% | +1.91% | +19.99% | -3.06% | -0.09% |

Leading-single-target short strings can regress, so this is not a universal
short-string speedup. Three-process hosted-runner measurements also vary
substantially; an unchanged search path showing a large change is not proof
that the search algorithm caused it. The
[local before/after report](../local-js-search-20261110/README.md) includes
a complete Astro comparison against the old ESM implementation, and the
[discarded 256-unit cutoff](../js-search-256-probe/README.md) retains the
sparse-input regressions that motivated the narrower cutoff.

## Native versus current ESM in Astro

The established nine-process paired gate passed on **all eight targets**.
This compares native against the **current** ESM implementation. It does not
measure the speedup caused by replacing the old JavaScript search loop.
Each scenario uses nine independent processes, four implementations, eight
500 ms balanced Williams blocks, and a minimum warmup iteration count.
Every render includes fresh Container creation and Response.text. Changes
are medians of within-process native/ESM ratios. Output hashes match across
implementations and rounds. Thresholds are unchanged: large props at most
-5%; each short official example at most +5%.

| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -23.890% | -0.656% | +0.124% | Pass |
| darwin-x64 | -14.220% | -0.341% | +0.643% | Pass |
| linux-arm64-gnu | -22.887% | +0.153% | +0.353% | Pass |
| linux-arm64-musl | -12.494% | +0.006% | +0.640% | Pass |
| linux-x64-gnu | -17.943% | -0.429% | +0.012% | Pass |
| linux-x64-musl | -9.458% | +0.010% | +0.398% | Pass |
| win32-arm64-msvc | -33.417% | +0.347% | +0.979% | Pass |
| win32-x64-msvc | -19.647% | -0.082% | -1.147% | Pass |

## Isolated-process Astro measurements

These use three independent processes per implementation and scenario.
A pass in the paired protocol does not turn an isolated failure into a pass.
Cold API/runtime imports, first renders, RSS and heap snapshots remain in
these raw JSON files. Positive values mean more time than current ESM.

| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -28.06% | -30.81% | -3.82% | Pass |
| darwin-x64 | -17.74% | +3.35% | +4.13% | Pass |
| linux-arm64-gnu | -23.87% | +1.35% | -1.52% | Pass |
| linux-arm64-musl | -14.51% | +0.97% | +1.66% | Pass |
| linux-x64-gnu | -19.87% | -3.66% | -2.26% | Pass |
| linux-x64-musl | -9.39% | +1.44% | -1.11% | Pass |
| win32-arm64-msvc | -34.22% | +1.54% | -1.37% | Pass |
| win32-x64-msvc | -17.36% | -0.91% | -0.11% | Pass |

## Environments and verification

All 24 target/Node jobs and the Wasm build succeeded, as did the separate
Node 22/24/26 and Chromium/Firefox/WebKit workflow. Eight platform npm
tarballs are archived by CI. All six exhaustive Rust tests passed on every
target/Node combination.
Each ARM64 log exercises NEON; each x86-64 log exercises SSE2 and AVX2,
alongside scalar and runtime dispatch. Node/browser fixtures cover all UTF-16
units, type errors and alternating calls around the 31/32/33 and 255/256/257
boundaries. Native jobs also exercise Workers and actual installed npm tarballs.
See the workflow manifest for each individual step and its conclusion.

| Target | CPU reported on Node 24 | Node 22 / 24 / 26 |
| --- | --- | --- |
| darwin-arm64 | Apple M1 (Virtual) | v22.23.4 / v24.22.2 / v26.13.0 |
| darwin-x64 | Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz | v22.23.2 / v24.19.0 / v26.13.0 |
| linux-arm64-gnu | unknown | v22.23.4 / v24.22.2 / v26.13.0 |
| linux-arm64-musl | unknown | v22.23.4 / v24.22.2 / v26.13.0 |
| linux-x64-gnu | AMD EPYC 9V74 80-Core Processor | v22.23.4 / v24.22.2 / v26.13.0 |
| linux-x64-musl | AMD EPYC 9V74 80-Core Processor | v22.23.4 / v24.22.2 / v26.13.0 |
| win32-arm64-msvc | Cobalt 100 | v22.23.4 / v24.22.2 / v26.13.0 |
| win32-x64-msvc | AMD EPYC 9V74 80-Core Processor | v22.23.4 / v24.22.2 / v26.13.0 |

Rust log line endings and trailing whitespace are normalized. JSON data is
copied unchanged from CI artifacts. Earlier results are preserved under
[the pre-change evaluation](../ci-20261110-paired-v2/README.md). No release or
npm publication was performed.
