# Full static-site builds across native environments

See the [interpretation](interpretation.md) and [initial setup failure with recovery](failures.md).

Source commits: `79c0f63ea166dceabebb79279cb3c560cb3c1fc0`, `b736e163074629eabcb69bdaff65c9b089f3ebb7`.

Workflow runs: [42829392447](https://github.com/jp-knj/html-escape/actions/runs/42829392447), [42831080918](https://github.com/jp-knj/html-escape/actions/runs/42831080918).

Verified 24 environments, 3600 timed builds, and 144 independent diagnostic builds. Each environment uses five fresh processes per library, site, and Worker count. All static outputs match byte-for-byte within each environment; actual escape input profiles match across all collected environments.

These are synthetic fixtures with clean Astro build caches and uncontrolled OS filesystem caches. Wall time includes startup, compilation, API initialization, rendering, and HTML writes. Dependency installation and verification are excluded. See the [protocol](../../ssg/README.md).

A lower median is descriptive, not a significance test. Check the individual reports for ranges and all samples. Hosted runner types have different CPUs and resources; compare libraries within each environment, not OS or architecture speeds against each other.

## Node 24, main rendering thread

Seconds, median of five complete builds.

| Target | Site | native | Wasm | escape-html | fast-escape-html | html-escaper |
|---|---|---:|---:|---:|---:|---:|
| darwin-arm64 | articles | 1.780 | 1.975 | 1.920 | 1.776 | 1.993 |
| darwin-arm64 | catalog | 1.541 | 1.533 | 1.433 | 1.429 | 1.411 |
| darwin-arm64 | props | 1.973 | 2.028 | 2.185 | 1.981 | 1.946 |
| darwin-x64 | articles | 5.916 | 5.869 | 5.517 | 6.249 | 6.526 |
| darwin-x64 | catalog | 3.881 | 4.098 | 3.822 | 3.330 | 3.590 |
| darwin-x64 | props | 3.851 | 4.477 | 4.026 | 4.018 | 4.811 |
| linux-arm64-gnu | articles | 1.997 | 1.987 | 1.984 | 1.989 | 2.003 |
| linux-arm64-gnu | catalog | 1.548 | 1.568 | 1.564 | 1.568 | 1.563 |
| linux-arm64-gnu | props | 1.726 | 1.805 | 1.774 | 1.779 | 1.820 |
| linux-arm64-musl | articles | 2.511 | 2.502 | 2.461 | 2.525 | 2.490 |
| linux-arm64-musl | catalog | 1.991 | 2.025 | 1.992 | 2.001 | 2.002 |
| linux-arm64-musl | props | 2.219 | 2.299 | 2.259 | 2.246 | 2.310 |
| linux-x64-gnu | articles | 1.886 | 1.892 | 1.871 | 1.885 | 1.883 |
| linux-x64-gnu | catalog | 1.505 | 1.521 | 1.510 | 1.503 | 1.515 |
| linux-x64-gnu | props | 1.753 | 1.814 | 1.822 | 1.811 | 1.855 |
| linux-x64-musl | articles | 1.445 | 1.437 | 1.447 | 1.459 | 1.491 |
| linux-x64-musl | catalog | 1.146 | 1.165 | 1.154 | 1.153 | 1.139 |
| linux-x64-musl | props | 1.390 | 1.403 | 1.397 | 1.384 | 1.426 |
| win32-arm64-msvc | articles | 4.274 | 4.253 | 4.137 | 4.218 | 4.233 |
| win32-arm64-msvc | catalog | 2.979 | 3.004 | 3.003 | 3.037 | 3.052 |
| win32-arm64-msvc | props | 3.095 | 3.115 | 3.209 | 3.237 | 3.217 |
| win32-x64-msvc | articles | 2.213 | 2.219 | 2.198 | 2.205 | 2.208 |
| win32-x64-msvc | catalog | 1.700 | 1.715 | 1.705 | 1.700 | 1.700 |
| win32-x64-msvc | props | 1.941 | 1.984 | 1.943 | 1.946 | 2.027 |

## Native relative to the fastest JavaScript competitor

Percent change in median wall time. Negative means less time. The baseline is the lowest median among the three competitors for that environment, site, and Worker count.

| Environment | Articles, main | Catalog, main | Props, main | Articles, 2 Workers | Catalog, 2 Workers | Props, 2 Workers |
|---|---:|---:|---:|---:|---:|---:|
| [darwin-arm64-node22](darwin-arm64-node22/ssg-results/README.md) | -9.90% | +6.34% | +1.17% | +7.01% | +15.09% | -4.12% |
| [darwin-arm64-node24](darwin-arm64-node24/ssg-results/README.md) | +0.23% | +9.16% | +1.38% | -5.20% | +7.88% | +2.07% |
| [darwin-arm64-node26](darwin-arm64-node26/ssg-results/README.md) | +15.01% | -0.47% | -11.14% | +1.32% | +7.15% | +28.15% |
| [darwin-x64-node22](darwin-x64-node22/ssg-results/README.md) | +18.00% | +15.11% | -2.87% | -1.03% | +15.71% | -3.78% |
| [darwin-x64-node24](darwin-x64-node24/ssg-results/README.md) | +7.23% | +16.55% | -4.15% | +26.50% | +11.85% | +5.28% |
| [darwin-x64-node26](darwin-x64-node26/ssg-results/README.md) | +12.86% | -2.57% | +5.63% | +29.22% | +0.95% | +3.52% |
| [linux-arm64-gnu-node22](linux-arm64-gnu-node22/ssg-results/README.md) | +1.08% | +1.54% | -1.41% | +1.18% | +1.12% | +1.03% |
| [linux-arm64-gnu-node24](linux-arm64-gnu-node24/ssg-results/README.md) | +0.63% | -0.97% | -2.71% | +0.62% | +0.97% | +0.38% |
| [linux-arm64-gnu-node26](linux-arm64-gnu-node26/ssg-results/README.md) | +0.79% | +0.29% | -0.36% | +1.34% | +1.26% | +1.06% |
| [linux-arm64-musl-node22](linux-arm64-musl-node22/ssg-results/README.md) | +0.79% | +0.13% | +0.45% | +1.89% | -0.14% | -0.77% |
| [linux-arm64-musl-node24](linux-arm64-musl-node24/ssg-results/README.md) | +2.04% | -0.09% | -1.20% | +0.97% | +0.64% | +0.24% |
| [linux-arm64-musl-node26](linux-arm64-musl-node26/ssg-results/README.md) | -0.34% | -0.29% | +2.08% | +0.91% | +2.46% | -0.75% |
| [linux-x64-gnu-node22](linux-x64-gnu-node22/ssg-results/README.md) | +0.41% | -0.09% | -1.46% | +0.52% | +0.81% | -0.69% |
| [linux-x64-gnu-node24](linux-x64-gnu-node24/ssg-results/README.md) | +0.81% | +0.12% | -3.19% | +0.31% | +0.47% | -1.35% |
| [linux-x64-gnu-node26](linux-x64-gnu-node26/ssg-results/README.md) | -0.35% | +0.71% | -0.86% | +1.31% | +1.13% | -2.29% |
| [linux-x64-musl-node22](linux-x64-musl-node22/ssg-results/README.md) | -0.63% | +2.24% | +0.16% | +0.52% | +1.04% | +1.59% |
| [linux-x64-musl-node24](linux-x64-musl-node24/ssg-results/README.md) | -0.15% | +0.68% | +0.45% | +1.37% | +2.11% | +0.75% |
| [linux-x64-musl-node26](linux-x64-musl-node26/ssg-results/README.md) | +1.49% | -0.08% | -0.09% | -0.02% | +0.70% | -0.59% |
| [win32-arm64-msvc-node22](win32-arm64-msvc-node22/ssg-results/README.md) | +1.12% | +0.65% | -0.74% | +0.04% | +0.04% | +0.07% |
| [win32-arm64-msvc-node24](win32-arm64-msvc-node24/ssg-results/README.md) | +3.29% | -0.79% | -3.56% | -0.51% | +3.09% | -0.78% |
| [win32-arm64-msvc-node26](win32-arm64-msvc-node26/ssg-results/README.md) | -0.65% | +0.84% | -1.37% | -0.49% | +2.20% | -0.97% |
| [win32-x64-msvc-node22](win32-x64-msvc-node22/ssg-results/README.md) | +0.02% | -0.88% | -1.27% | +0.25% | +1.32% | -0.55% |
| [win32-x64-msvc-node24](win32-x64-msvc-node24/ssg-results/README.md) | +0.67% | +0.01% | -0.09% | +1.28% | +0.21% | -1.65% |
| [win32-x64-msvc-node26](win32-x64-msvc-node26/ssg-results/README.md) | +0.72% | +1.55% | -0.03% | +0.17% | -0.23% | -0.04% |

## Native parallelism and memory, Node 24

Two-Worker versus main-thread native wall-time change, with median process peak RSS in MiB. Workers share a process; RSS includes all threads. Separately spawned processes are excluded.

| Target | Site | Wall-time change | Main-thread peak MiB | Two-Worker peak MiB |
|---|---|---:|---:|---:|
| darwin-arm64 | articles | +14.09% | 401.2 | 488.4 |
| darwin-arm64 | catalog | +4.31% | 382.9 | 465.5 |
| darwin-arm64 | props | -9.30% | 451.6 | 574.1 |
| darwin-x64 | articles | +15.06% | 365.3 | 463.5 |
| darwin-x64 | catalog | -2.99% | 347.2 | 438.6 |
| darwin-x64 | props | -4.98% | 401.3 | 530.5 |
| linux-arm64-gnu | articles | +9.81% | 547.7 | 645.5 |
| linux-arm64-gnu | catalog | +9.69% | 529.5 | 601.4 |
| linux-arm64-gnu | props | +4.38% | 586.2 | 716.3 |
| linux-arm64-musl | articles | +14.91% | 549.2 | 639.2 |
| linux-arm64-musl | catalog | +14.56% | 537.8 | 568.9 |
| linux-arm64-musl | props | +7.66% | 586.6 | 704.5 |
| linux-x64-gnu | articles | +10.91% | 536.3 | 642.3 |
| linux-x64-gnu | catalog | +11.36% | 511.4 | 583.0 |
| linux-x64-gnu | props | +2.26% | 558.3 | 702.0 |
| linux-x64-musl | articles | +14.04% | 529.2 | 637.8 |
| linux-x64-musl | catalog | +14.75% | 513.3 | 560.2 |
| linux-x64-musl | props | +6.26% | 555.6 | 683.4 |
| win32-arm64-msvc | articles | -2.87% | 358.4 | 446.3 |
| win32-arm64-msvc | catalog | +11.73% | 334.9 | 415.3 |
| win32-arm64-msvc | props | +4.15% | 394.8 | 510.2 |
| win32-x64-msvc | articles | +8.28% | 357.4 | 451.4 |
| win32-x64-msvc | catalog | +10.88% | 347.7 | 421.6 |
| win32-x64-msvc | props | +6.17% | 372.1 | 499.9 |

## Interpretation limits

- Article inputs are at most 30 UTF-16 units; catalog inputs at most 49. Static article body size does not imply a long escape call.
- Props pages each make one escape call for JSON of up to 162,559 UTF-16 units. Astro uses its separate attribute implementation for the duplicate JSON attribute; that implementation is unchanged.
- API import times and full input distributions are in every per-environment report. GC data comes from separate instrumented builds and is diagnostic only, not an unbiased timing comparison.
- These measurements do not establish the original Container benchmark gate, installation-time performance, incremental-build performance, or results for an unspecified production site.

Raw source hashes are verified against the local source bytes, allowing only Git checkout conversion from LF to CRLF on Windows.

Every environment folder includes all raw samples, output hashes, source hashes, runtime versions, and its own report. Empty build logs are represented by build-log-sizes.json; nonempty logs are retained. No speed-based samples are removed or retried.
