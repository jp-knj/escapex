# Adaptive search: real-machine evaluation — 2026-11-10

Source [11719c3](https://github.com/jp-knj/html-escape/commit/11719c3f35a1f7fe15ea8fa642b0b561bfa1456e).
[Native workflow](https://github.com/jp-knj/html-escape/actions/runs/42775696241) and
[ESM/Wasm/browser CI](https://github.com/jp-knj/html-escape/actions/runs/42775696184).
The local final production and benchmark source files match this commit; documentation and recorded results were added afterward.

## Outcome

The goal of beating all three competitors on every case and environment is **not met**.
All 24 OS/CPU/libc/Node combinations completed the Rust, Node, Worker and installed-package correctness checks.
The separate Node 22/24/26 and Chromium/Firefox/WebKit CI passed.
Three Node 24 jobs failed the paired Astro performance gate: macOS x86-64, Linux ARM64 musl, and Linux x86-64 musl.
All three jobs stopped at the recorded performance gate. No general native-speedup claim is made.
The other five targets met the large-props gate, and all eight met the two short-page gates.

The first macOS x86-64/Node 26 job completed its tests and competitors benchmark, then failed to upload evidence after five artifact-service timeouts.
Only that job was retried to recover raw data, with no production changes.
The [initial timing table and upload failure](darwin-x64-node26-upload.log) are preserved.
The three Astro gate failures were not retried. Five platform-package artifacts were archived; three jobs stopped before the final packaging step. All 24 environments had already passed the installed-package tests.
No release or npm publication was performed.

## Competitor method

Each environment ran three fresh processes per implementation on the same host, with a rotated order.
Five implementations were compared, so three rounds do not fully balance every execution position.
The [local comparison](../competitors-20261110-adaptive/README.md) uses five rounds and balances those positions.
Warmup is at least 100 ms and 10,000 calls for inputs below 256 UTF-16 units, or 1,000 calls otherwise.
Every case measures at least 300 ms; every call consumes `Buffer.byteLength(result)`, including string flattening.
Initialization is excluded. The statistic is the median of independent process means.
Observed min/max values and all samples are saved; these are not confidence intervals.
The macOS Intel/Node 24 original-short process means range from 335–478 ns for ESM and 381–529 ns for native, illustrating the variation in these hosted measurements.
The suite retains the original 12 cases and adds 13 position, spacing, length and changing-input cases.
The two pools rotate 36 short and 24 long strings. Pinned versions are escape-html 1.0.3, fast-escape-html 1.1.0 and html-escaper 3.0.3.
Equivalent primitive-string output is asserted before timing; the raw contract probes describe coercion differences.
Linux, macOS and Windows runners execute their native CPU instruction sets, without QEMU.
Hosted-runner CPU types, load and runtime versions differ; compare implementations within a row rather than absolute times across rows.

## Cases below all three rivals

Counts out of 25. Equal weighting of these synthetic cases is not an application score.
Even a tiny lower median counts here; close ranks can overlap across process ranges.
Every non-winning case, its median and its fastest competitor are listed in [all misses](misses.md).

| Target / Node | Our ESM | Our native | Original short: ESM ns | Original short: native ns | Fastest rival ns | Raw samples |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| darwin-arm64-node22 | 8 | 21 | 198.9 | 186.3 | 201.4 | [JSON](darwin-arm64-node22/bench-results/competitors-darwin-arm64-node22.json) |
| darwin-arm64-node24 | 17 | 24 | 218.2 | 210.1 | 231.9 | [JSON](darwin-arm64-node24/bench-results/competitors-darwin-arm64-node24.json) |
| darwin-arm64-node26 | 15 | 19 | 182.3 | 263.9 | 194.5 | [JSON](darwin-arm64-node26/bench-results/competitors-darwin-arm64-node26.json) |
| darwin-x64-node22 | 6 | 14 | 593.5 | 557.0 | 548.4 | [JSON](darwin-x64-node22/bench-results/competitors-darwin-x64-node22.json) |
| darwin-x64-node24 | 12 | 6 | 366.9 | 495.3 | 412.9 | [JSON](darwin-x64-node24/bench-results/competitors-darwin-x64-node24.json) |
| darwin-x64-node26 | 19 | 17 | 332.2 | 364.4 | 350.3 | [JSON](darwin-x64-node26/bench-results/competitors-darwin-x64-node26.json) |
| linux-arm64-gnu-node22 | 14 | 18 | 207.7 | 211.3 | 219.5 | [JSON](linux-arm64-gnu-node22/bench-results/competitors-linux-arm64-node22.json) |
| linux-arm64-gnu-node24 | 17 | 21 | 210.9 | 218.0 | 224.7 | [JSON](linux-arm64-gnu-node24/bench-results/competitors-linux-arm64-node24.json) |
| linux-arm64-gnu-node26 | 17 | 21 | 206.0 | 209.9 | 218.6 | [JSON](linux-arm64-gnu-node26/bench-results/competitors-linux-arm64-node26.json) |
| linux-arm64-musl-node22 | 14 | 18 | 221.3 | 223.7 | 239.9 | [JSON](linux-arm64-musl-node22/bench-results/competitors-linux-arm64-node22.json) |
| linux-arm64-musl-node24 | 17 | 21 | 239.3 | 236.0 | 260.4 | [JSON](linux-arm64-musl-node24/bench-results/competitors-linux-arm64-node24.json) |
| linux-arm64-musl-node26 | 16 | 23 | 228.0 | 222.8 | 238.1 | [JSON](linux-arm64-musl-node26/bench-results/competitors-linux-arm64-node26.json) |
| linux-x64-gnu-node22 | 16 | 19 | 168.5 | 185.9 | 192.3 | [JSON](linux-x64-gnu-node22/bench-results/competitors-linux-x64-node22.json) |
| linux-x64-gnu-node24 | 15 | 23 | 225.5 | 230.0 | 255.8 | [JSON](linux-x64-gnu-node24/bench-results/competitors-linux-x64-node24.json) |
| linux-x64-gnu-node26 | 19 | 22 | 97.1 | 103.0 | 112.2 | [JSON](linux-x64-gnu-node26/bench-results/competitors-linux-x64-node26.json) |
| linux-x64-musl-node22 | 16 | 20 | 256.3 | 253.8 | 291.4 | [JSON](linux-x64-musl-node22/bench-results/competitors-linux-x64-node22.json) |
| linux-x64-musl-node24 | 16 | 18 | 296.9 | 300.8 | 316.9 | [JSON](linux-x64-musl-node24/bench-results/competitors-linux-x64-node24.json) |
| linux-x64-musl-node26 | 23 | 25 | 204.8 | 204.0 | 228.7 | [JSON](linux-x64-musl-node26/bench-results/competitors-linux-x64-node26.json) |
| win32-arm64-msvc-node22 | 16 | 18 | 225.6 | 242.3 | 235.2 | [JSON](win32-arm64-msvc-node22/bench-results/competitors-win32-arm64-node22.json) |
| win32-arm64-msvc-node24 | 17 | 20 | 423.6 | 434.2 | 437.4 | [JSON](win32-arm64-msvc-node24/bench-results/competitors-win32-arm64-node24.json) |
| win32-arm64-msvc-node26 | 17 | 20 | 262.4 | 278.9 | 274.5 | [JSON](win32-arm64-msvc-node26/bench-results/competitors-win32-arm64-node26.json) |
| win32-x64-msvc-node22 | 15 | 18 | 220.5 | 235.1 | 237.8 | [JSON](win32-x64-msvc-node22/bench-results/competitors-win32-x64-node22.json) |
| win32-x64-msvc-node24 | 12 | 16 | 245.3 | 248.1 | 256.6 | [JSON](win32-x64-msvc-node24/bench-results/competitors-win32-x64-node24.json) |
| win32-x64-msvc-node26 | 9 | 12 | 301.4 | 312.4 | 312.2 | [JSON](win32-x64-msvc-node26/bench-results/competitors-win32-x64-node26.json) |

Full JSON currently available for 24 environments. The initial macOS x86-64/Node 26 log provides only rounded medians; its failed upload did not preserve per-process samples.
All files are retained without selecting favorable outcomes. The short native path calls the shared ESM implementation, so its measurements are not Rust-only timings.

## Astro: paired protocol

Each scenario uses nine fresh processes. Each process contains all four implementations, four warmups and 32 measured blocks in eight Williams-balanced cycles.
Warmup is at least one second per implementation and 100 renders for large props or 10,000 renders for each short example.
Each block lasts at least 500 ms. Every render creates a fresh Astro Container and includes complete `Response.text()` collection.
Output SHA-256 hashes match across all variants and rounds. The reported change is the median of the nine within-process native/ESM ratios.
It is not the ratio of the displayed medians and is not a confidence interval.
Acceptance is at least 5% less time on large props and at most 5% more on each official example.

| Target | Large ESM ms | Large native ms | Large change | Hero change | with-vitest change | All gates | Raw samples |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| darwin-arm64 | 16.9355 | 14.4596 | -16.14% | +0.08% | -4.07% | Pass | [JSON](darwin-arm64-node24/bench-results/astro-paired-darwin-arm64-node24.json) |
| darwin-x64 | 23.4437 | 22.4590 | -2.29% | +1.37% | +1.50% | **Fail** | [JSON](darwin-x64-node24/bench-results/astro-paired-darwin-x64-node24.json) |
| linux-arm64-gnu | 12.0688 | 10.9315 | -9.27% | -0.25% | -0.72% | Pass | [JSON](linux-arm64-gnu-node24/bench-results/astro-paired-linux-arm64-node24.json) |
| linux-arm64-musl | 13.6579 | 13.6666 | -0.17% | -0.25% | -0.81% | **Fail** | [JSON](linux-arm64-musl-node24/bench-results/astro-paired-linux-arm64-node24.json) |
| linux-x64-gnu | 13.3321 | 12.3523 | -7.20% | -0.78% | -0.32% | Pass | [JSON](linux-x64-gnu-node24/bench-results/astro-paired-linux-x64-node24.json) |
| linux-x64-musl | 17.7006 | 18.1329 | +1.86% | -0.35% | -0.12% | **Fail** | [JSON](linux-x64-musl-node24/bench-results/astro-paired-linux-x64-node24.json) |
| win32-arm64-msvc | 21.2960 | 15.6863 | -27.12% | +0.56% | +0.57% | Pass | [JSON](win32-arm64-msvc-node24/bench-results/astro-paired-win32-arm64-node24.json) |
| win32-x64-msvc | 12.1472 | 10.7608 | -10.78% | +0.48% | +0.56% | Pass | [JSON](win32-x64-msvc-node24/bench-results/astro-paired-win32-x64-node24.json) |

The JavaScript HTML algorithm also changed, so the comparator is the current optimized ESM API.
The earlier [pre-adaptive evaluation](../ci-js-search-20261110/README.md) used an older ESM baseline and met all eight paired gates.
These are separate runs on hosted machines; the difference does not establish a paired before/after effect.

## Astro: isolated protocol

Three independent worker processes per implementation and scenario, with the same fresh-container/full-response definition.
Each scenario warms for at least 400 ms and measures at least 1,200 ms. The statistic is the ratio of process-mean medians.
All results, including failures that differ from the paired protocol, are retained.

| Target | Large change | Hero change | with-vitest change | All gates | Raw samples |
| --- | ---: | ---: | ---: | --- | --- |
| darwin-arm64 | -19.71% | -30.45% | -10.97% | Pass | [JSON](darwin-arm64-node24/bench-results/astro-darwin-arm64-node24.json) |
| darwin-x64 | -13.67% | +16.29% | -14.92% | **Fail** | [JSON](darwin-x64-node24/bench-results/astro-darwin-x64-node24.json) |
| linux-arm64-gnu | -8.16% | -2.09% | -2.19% | Pass | [JSON](linux-arm64-gnu-node24/bench-results/astro-linux-arm64-node24.json) |
| linux-arm64-musl | -2.39% | +0.83% | -1.98% | **Fail** | [JSON](linux-arm64-musl-node24/bench-results/astro-linux-arm64-node24.json) |
| linux-x64-gnu | -7.19% | +2.92% | -6.65% | Pass | [JSON](linux-x64-gnu-node24/bench-results/astro-linux-x64-node24.json) |
| linux-x64-musl | -1.31% | +0.84% | -0.76% | **Fail** | [JSON](linux-x64-musl-node24/bench-results/astro-linux-x64-node24.json) |
| win32-arm64-msvc | -26.73% | -1.53% | +0.02% | Pass | [JSON](win32-arm64-msvc-node24/bench-results/astro-win32-arm64-node24.json) |
| win32-x64-msvc | -8.34% | +0.18% | -0.64% | Pass | [JSON](win32-x64-msvc-node24/bench-results/astro-win32-x64-node24.json) |

## Cold import and memory

Import is the median of nine isolated Astro processes per implementation (three scenarios × three rounds).
First large render, peak RSS and post-GC RSS/heap are medians of the three large-props processes.
Peak RSS is process-wide, not an allocation count; GC and allocator retention affect these figures.
Cold import is not part of the steady-render gate. The raw data also includes runtime import, external memory and ArrayBuffers.

| Target | API | Import ms | First large render ms | Peak RSS MiB | RSS after GC MiB | Heap after GC MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| darwin-arm64 | esm | 0.943 | 87.726 | 380.45 | 353.09 | 13.99 |
| darwin-arm64 | wasm | 1.796 | 62.120 | 377.75 | 329.69 | 12.64 |
| darwin-arm64 | native-scalar | 5.381 | 69.562 | 443.00 | 395.64 | 12.88 |
| darwin-arm64 | native | 5.479 | 66.308 | 438.39 | 388.34 | 12.87 |
| darwin-x64 | esm | 1.929 | 141.956 | 283.25 | 252.04 | 13.82 |
| darwin-x64 | wasm | 3.990 | 136.260 | 245.95 | 183.25 | 13.81 |
| darwin-x64 | native-scalar | 10.044 | 126.786 | 253.80 | 203.84 | 14.05 |
| darwin-x64 | native | 10.810 | 115.914 | 246.66 | 193.04 | 14.05 |
| linux-arm64-gnu | esm | 1.153 | 67.163 | 337.60 | 310.45 | 12.67 |
| linux-arm64-gnu | wasm | 2.030 | 67.539 | 363.79 | 314.27 | 12.67 |
| linux-arm64-gnu | native-scalar | 6.438 | 59.651 | 357.57 | 276.14 | 12.94 |
| linux-arm64-gnu | native | 6.435 | 60.037 | 356.84 | 259.20 | 12.94 |
| linux-arm64-musl | esm | 1.741 | 100.991 | 332.35 | 231.52 | 12.62 |
| linux-arm64-musl | wasm | 3.017 | 88.610 | 350.54 | 224.39 | 12.60 |
| linux-arm64-musl | native-scalar | 7.764 | 83.369 | 356.92 | 230.04 | 12.86 |
| linux-arm64-musl | native | 7.476 | 85.265 | 348.75 | 222.07 | 12.86 |
| linux-x64-gnu | esm | 1.171 | 81.737 | 341.26 | 292.59 | 12.89 |
| linux-x64-gnu | wasm | 2.042 | 76.671 | 356.65 | 265.81 | 12.88 |
| linux-x64-gnu | native-scalar | 6.713 | 67.772 | 358.65 | 293.25 | 13.14 |
| linux-x64-gnu | native | 6.625 | 68.893 | 360.33 | 269.32 | 13.14 |
| linux-x64-musl | esm | 1.781 | 126.341 | 330.45 | 232.20 | 12.85 |
| linux-x64-musl | wasm | 3.260 | 113.404 | 333.39 | 207.61 | 12.80 |
| linux-x64-musl | native-scalar | 8.436 | 102.066 | 329.45 | 204.03 | 13.05 |
| linux-x64-musl | native | 8.324 | 101.367 | 330.53 | 204.67 | 13.05 |
| win32-arm64-msvc | esm | 1.858 | 87.110 | 309.35 | 256.01 | 13.64 |
| win32-arm64-msvc | wasm | 3.169 | 84.257 | 307.64 | 224.64 | 12.61 |
| win32-arm64-msvc | native-scalar | 8.953 | 71.413 | 313.30 | 224.66 | 12.97 |
| win32-arm64-msvc | native | 8.568 | 75.628 | 311.24 | 217.79 | 12.97 |
| win32-x64-msvc | esm | 1.285 | 64.507 | 309.99 | 226.85 | 13.07 |
| win32-x64-msvc | wasm | 2.199 | 62.528 | 334.82 | 220.12 | 13.07 |
| win32-x64-msvc | native-scalar | 4.980 | 55.697 | 332.37 | 225.32 | 13.33 |
| win32-x64-msvc | native | 4.893 | 57.493 | 331.68 | 237.58 | 13.33 |

## Environment and SIMD evidence

Every environment includes `native-environment.json` and `native-rust-tests.log`.
The logs directly exercise scalar, runtime dispatch and NEON on ARM64, or SSE2 and AVX2 on x86-64.
CPU support is checked before invoking each implementation. Rust tests cover every UTF-16 code unit in every lane, every match mask, unaligned starts, vector tails and large inputs.
Node tests cover all exports, primitive-string TypeErrors, lone surrogates, adaptive boundaries, no-copy paths, Workers, tarball installation and TypeScript declarations.
All prior comparison files, [candidate experiments](../competitive-exploration-20261110/README.md), and failed outcomes remain available.
The [benchmark guide](../../README.md) describes reproduction; no npm publication occurred.
