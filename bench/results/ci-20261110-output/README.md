# Native output optimization, three-process protocol — 2026-11-10

All 24 target/Node correctness checks passed. The v1 paired performance gate
passed on six of eight targets, including macOS Intel after the Rust output
optimization. It failed on macOS ARM64 short examples and Linux x86-64 glibc
with-vitest. These are retained failures, not an all-target performance pass.

- Source: [`6fa439c`](https://github.com/jp-knj/html-escape/commit/6fa439c5b56346829b2415d36ee473ba74ae9862).
- [Native run](https://github.com/jp-knj/html-escape/actions/runs/42753706705): two performance-gate failures.
- [Existing CI](https://github.com/jp-knj/html-escape/actions/runs/42753706577): all four jobs passed.
- [Workflow/job/artifact manifest](workflows.json).

Rust now reserves the known minimum remaining output once per match and uses
constant-sized entity copies. Scalar and SIMD scanners share the writer. The
UTF-16, all-mask, boundary, Worker and installed-package tests passed.

These v1 paired results divide independent absolute-time medians. This can
lose the within-process pairing. The subsequent v2 protocol computes each
process native/ESM ratio first, then takes the median across nine processes.
It also requires minimum warmup iteration counts on slow runners. The old
values below are unchanged, including failed cases. No v2 pass is implied here.

## Paired v1

Native time versus ESM; negative means less time. Three independent runs.
| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -27.15% | +13.79% | +7.86% | **Not met** |
| darwin-x64 | -12.70% | -4.65% | -9.40% | Pass |
| linux-arm64-gnu | -23.00% | +0.81% | +1.75% | Pass |
| linux-arm64-musl | -12.52% | +1.08% | -1.22% | Pass |
| linux-x64-gnu | -14.22% | +2.06% | +5.52% | **Not met** |
| linux-x64-musl | -6.51% | +0.64% | -1.55% | Pass |
| win32-arm64-msvc | -34.43% | +0.10% | +0.53% | Pass |
| win32-x64-msvc | -17.94% | +1.52% | +1.58% | Pass |

## Isolated processes

Native time versus ESM; negative means less time. Three independent runs.
| Target | Large props | Portfolio Hero | with-vitest | All thresholds |
| --- | ---: | ---: | ---: | --- |
| darwin-arm64 | -23.76% | +19.15% | -16.49% | **Not met** |
| darwin-x64 | -6.12% | -25.48% | -8.05% | Pass |
| linux-arm64-gnu | -20.77% | +3.05% | +2.30% | Pass |
| linux-arm64-musl | -13.84% | +0.04% | -1.17% | Pass |
| linux-x64-gnu | -14.07% | -2.60% | -2.75% | Pass |
| linux-x64-musl | -11.89% | -2.10% | +0.04% | Pass |
| win32-arm64-msvc | -32.94% | -1.60% | +0.52% | Pass |
| win32-x64-msvc | -17.78% | -0.06% | -0.41% | Pass |

All raw blocks, startup/memory records and environment metadata are preserved
in the target/Node directories. Rust logs normalize line endings and trailing
whitespace. See [methodology](../../README.md), [local measurements](../local-20261110-output/README.md)
and [other library comparison](../competitors-20261110-output/README.md).
