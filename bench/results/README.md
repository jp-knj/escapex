# macOS ARM64 evaluation

For the current internal function cleanup, see the
[local validation and paired measurements](cleanup-20261111/README.md). It removes
two forwarding helpers and shares the HTML entity table while retaining the
existing public API. The cleanup is not a new cross-platform speedup claim.

For the preceding library-only short-string change, see the
[eight-target API evaluation](library-ci-20261111/README.md) and
[local before/after comparison](library-local-20261111/README.md). These compare
the public native and default ESM entries with their actual predecessor; no
static-site workload or Astro source was changed. They do not establish a
full-build speedup.

For the preceding native kernel change, see the
[packed-copy native evaluation](tuning-ci-20261110/README.md) and
[local before/after results](tuning-local-20261110/README.md). All 24 correctness
environments passed. Quoted-JSON API medians improve on all eight Node 24
targets, by at least 5% on six. The 5% full-SSG goal against the fastest of the
three competitors is not met; none of the eight large-props CI medians meets it.

The preceding implementation is documented in the
[adaptive-search real-machine evaluation](ci-competitive-20261110/README.md)
and [five-round local competitor comparison](competitors-20261110-adaptive/README.md).
The all-case/all-environment competitor goal is not met. Five of eight targets
meet the paired Astro large-props gate; all eight meet both short-page gates.
The [JavaScript search adoption report](ci-js-search-20261110/README.md),
[local before/after measurements](local-js-search-20261110/README.md), and
[seven-implementation comparison](competitors-20261110-search/README.md)
describe the preceding implementation.
The [earlier paired v2 evaluation](ci-20261110-paired-v2/README.md) and
[other library comparison](competitors-20261110-output/README.md) precede this
search change and remain available as historical results.

Historical result: the Astro harness below reused a Container whose route
table grew on every render. Its timing and memory figures do not establish
steady render costs. The corrected harness creates one Container per render,
including creation in the timed region. API microbenchmarks and correctness
checks are unaffected.

This is the initial local Apple M2 evaluation. The subsequent
[24-environment native hardware validation](ci-20261110/README.md) passed all
correctness checks on macOS, Linux and Windows, including SSE2 and AVX2.
In that initial run, two macOS short examples exceeded the 5% threshold.
The subsequent output optimization and corrected benchmark protocols are
documented in the [follow-up evaluation](ci-20261110-output/README.md).

Measured on 2026-11-10 JST: Apple M2, Darwin 25.5.0, Node.js 24.22.2,
Rust 1.91.1, Astro 7.4.8, compiler-rs 0.5.3. Each cell below is the median of
three independent process means. Native dispatch selected NEON on this host.

## Astro response collection

| Scenario | ESM ms | Wasm ms | Native scalar ms | Native SIMD ms | SIMD vs ESM |
| --- | ---: | ---: | ---: | ---: | ---: |
| Large props | 12.4780 | 10.6817 | 9.5387 | 8.8942 | -28.72% |
| Official portfolio Hero | 0.05814 | 0.05832 | 0.05917 | 0.05882 | +1.17% |
| Official with-vitest page | 0.05538 | 0.05582 | 0.05526 | 0.05560 | +0.40% |

These local medians meet the planned thresholds: at least 5% less time for
large props and at most 5% more time for each short official example. The
large-props output is 1,347,360 UTF-16 units. All output hashes match across
implementations and rounds. Native SIMD is 6.76% below native scalar on this
large-props workload, so the total improvement is not solely due to SIMD.

Large-props runs (ms/render): ESM `12.4780, 12.3708, 13.4700`; native SIMD
`8.8574, 8.8942, 11.2454`. The variation matters; this is not a confidence
interval or a general performance guarantee. This initial run covers ARM64
only; see the separate CI evaluation above for x86-64 measurements. There is
no general native-speedup claim.

## Startup and memory

API cold import includes Wasm read/initialization or native library loading.
Import figures below are medians of the nine fresh Astro worker processes per
implementation (three scenarios times three rounds). Other figures are the
three large-props processes. Memory reflects the entire process; Node GC and
the system allocator may retain pages after collection.

| Implementation | API import ms | First complete large render ms | Peak RSS MiB | RSS after GC MiB | JS heap after GC MiB |
| --- | ---: | ---: | ---: | ---: | ---: |
| ESM | 0.401 | 49.259 | 355.80 | 328.16 | 12.54 |
| Wasm | 1.011 | 42.220 | 391.16 | 341.11 | 12.60 |
| Native scalar | 2.611 | 34.206 | 400.02 | 350.66 | 12.82 |
| Native SIMD | 2.594 | 33.594 | 401.91 | 351.84 | 12.85 |

Native uses more process memory here despite lower steady render times. Astro
runtime import is recorded separately in the raw results (roughly 68 ms
median for each variant).

## Microbenchmarks

Selected `escapeHTML` results, including output byte-length consumption:

| Input | ESM ns/call | Native SIMD ns/call | SIMD vs ESM |
| --- | ---: | ---: | ---: |
| Short, with HTML characters | 193 | 365 | +88.86% |
| Unchanged short string | 50.5 | 50.7 | +0.40% |
| Quoted JSON | 305,289 | 104,880 | -65.65% |
| Japanese and emoji | 466,732 | 151,125 | -67.62% |
| Long, sparse markup | 144,245 | 238,756 | +65.52% |

Native is slower for short converted strings and long sparse markup in this
measurement. The short Astro examples spend little total time escaping, which
is why their complete render results differ from the short microbenchmark.
The raw microbenchmark file includes every operation and all four variants.

## Correctness verification

- macOS ARM64: Rust scalar, runtime dispatch and NEON tests passed, including
  all UTF-16 values and all 16-lane match masks. Rust format and Clippy checks
  passed for Wasm and native.
- Node.js 22.21.1, 24.22.2 and 26.13.0: native API, npm tarball, Worker and
  loader-error tests passed. Node 22 and 26 also passed the existing ESM/Wasm
  tests. Node 22 passed Vite/Rolldown and declaration tests.
- Browser tests were attempted locally, but macOS sandbox permissions blocked
  Chromium startup (`MachPortRendezvousServer: Permission denied`). The
  subsequent Chromium/Firefox/WebKit CI job passed; no local browser success
  is claimed.
- The new native CI matrix covers all eight target packages on Node 22/24/26.
  The subsequent remote run passed all 24 environments and directly executed
  NEON, SSE2 and AVX2. Before that run, local `cargo check` for
  `x86_64-apple-darwin`, with `native` and all targets, passed using the
  official Rust 1.91.1 x86-64 standard library; this checks the SSE2/AVX2 code
  but does not execute those instructions.

Raw data: [Astro](astro-darwin-arm64-node24.json) and
[microbenchmarks](micro-darwin-arm64-node24.json).
See [methodology and reproduction commands](../README.md).
