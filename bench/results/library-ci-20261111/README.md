# Library-only search evaluation

Candidate `e093ab74a1b6c63573a9504a14e03482f2c41fe7`; packed-copy predecessor `cf51cdce642d3a45d044d0e5eb61f89dab48319e`.

[Workflow 42933340929](https://github.com/jp-knj/html-escape/actions/runs/42933340929) passed all 24 platform/Node correctness combinations. The eight Node 24 targets completed five fresh processes for each of five implementations, with all 25 existing cases: 200 processes and 5,000 timed case samples. The default ESM entry was separately compared with its predecessor in three processes per version: another 48 processes and 1,200 timed case samples. Artifact digests, source hashes and medians were verified; all samples are retained.

Only html-escape JavaScript changed: for inputs shorter than 128 UTF-16 units, emit the first known match directly and classify following units with the ASCII entity table. Move the native long-input path into a private function. The long ESM scanner, Rust, native string conversion and CPU dispatch match the predecessor. See the [protocol](../../library/README.md).

## Native API change vs the preceding native API

| Target | Short | First match at 0, length 31 | Dense 31 | Last match, length 31 | Mixed short |
|---|---:|---:|---:|---:|---:|
| [darwin-arm64](darwin-arm64-node24/README.md) | -20.32% | -13.41% | -16.82% | -12.12% | -2.29% |
| [darwin-x64](darwin-x64-node24/README.md) | -9.84% | -5.69% | -17.90% | -15.36% | +19.78% |
| [linux-arm64-gnu](linux-arm64-gnu-node24/README.md) | -10.41% | -4.57% | -5.00% | -7.06% | -2.09% |
| [linux-x64-gnu](linux-x64-gnu-node24/README.md) | -10.58% | -2.74% | -1.87% | +3.27% | -2.76% |
| [linux-arm64-musl](linux-arm64-musl-node24/README.md) | -10.21% | -4.17% | -4.48% | -4.67% | -1.71% |
| [linux-x64-musl](linux-x64-musl-node24/README.md) | -8.88% | -3.79% | -4.35% | -3.70% | -0.81% |
| [win32-arm64-msvc](win32-arm64-msvc-node24/README.md) | -5.21% | -1.90% | -1.45% | -3.55% | -2.08% |
| [win32-x64-msvc](win32-x64-msvc-node24/README.md) | -7.20% | -9.70% | -5.37% | -4.03% | -3.77% |

## Comparison with the three competing libraries

For each case, the reference is the lowest median among escape-html 1.0.3, fast-escape-html 1.1.0 and html-escaper 3.0.3 on the same runner. Counts are descriptive comparisons of medians, not statistical significance tests.

| Target | Native short ns | Fastest competitor short ns | Short change | Cases below all three | Cases at least 5% below all three |
|---|---:|---:|---:|---:|---:|
| darwin-arm64 | 173.9 | 223.6 (fast-escape-html) | -22.22% | 21/25 | 19/25 |
| darwin-x64 | 355.8 | 357.5 (fast-escape-html) | -0.49% | 22/25 | 18/25 |
| linux-arm64-gnu | 193.6 | 227.6 (fast-escape-html) | -14.93% | 23/25 | 20/25 |
| linux-x64-gnu | 105.7 | 123.1 (fast-escape-html) | -14.16% | 24/25 | 20/25 |
| linux-arm64-musl | 212.3 | 258.6 (fast-escape-html) | -17.90% | 24/25 | 18/25 |
| linux-x64-musl | 178.8 | 219.6 (escape-html) | -18.57% | 22/25 | 19/25 |
| win32-arm64-msvc | 415.9 | 437.5 (fast-escape-html) | -4.95% | 21/25 | 16/25 |
| win32-x64-msvc | 229.6 | 257.0 (fast-escape-html) | -10.67% | 18/25 | 12/25 |

## Default ESM before and after

| Target | Short | Quoted JSON | Japanese/emoji | Long body | Mixed short |
|---|---:|---:|---:|---:|---:|
| darwin-arm64 | +7.59% | +31.24% | -14.57% | -14.95% | -16.20% |
| darwin-x64 | +1.99% | -3.08% | +35.63% | -6.41% | +1.79% |
| linux-arm64-gnu | -3.59% | +0.23% | -0.82% | -1.70% | -0.40% |
| linux-x64-gnu | -2.97% | +1.97% | +11.25% | -15.59% | -0.46% |
| linux-arm64-musl | -4.62% | +0.66% | +0.43% | -0.51% | -0.63% |
| linux-x64-musl | -4.69% | -0.07% | +0.36% | +0.12% | -1.49% |
| win32-arm64-msvc | -2.08% | +0.02% | -4.02% | -0.84% | +0.92% |
| win32-x64-msvc | -4.99% | -1.35% | -4.91% | -1.35% | -2.95% |

## Largest measured increases vs the predecessor

Each cell selects the largest median increase among all 25 cases. These observations are retained even where the executed long-input scanner is unchanged; this evaluation alone does not distinguish host variation from a repeatable regression.

| Target | Native API | Default ESM API |
|---|---:|---:|
| darwin-arm64 | +18.48% (two-far-31) | +31.24% (quoted-json) |
| darwin-x64 | +19.78% (mixed-short) | +35.63% (japanese-emoji) |
| linux-arm64-gnu | +1.37% (dense-255) | +5.27% (unchanged-short) |
| linux-x64-gnu | +4.17% (mixed-long) | +11.25% (japanese-emoji) |
| linux-arm64-musl | +0.55% (dense-32) | +2.73% (two-far-31) |
| linux-x64-musl | +0.48% (unchanged-long) | +1.35% (unchanged-16) |
| win32-arm64-msvc | +3.85% (unchanged-short) | +1.20% (dense-255) |
| win32-x64-msvc | +5.68% (two-near-31) | +15.86% (dense-quotes) |

These measurements time the public escapeHTML API and output consumption, excluding imports. They do not establish a static-site build speedup. Per-target reports link all ranges and raw samples. No universal 5% improvement, absence of regressions, or all-case competitor win is claimed.

The initial candidate in [run 42932077586](https://github.com/jp-knj/html-escape/actions/runs/42932077586) also changed the long ESM scanner. That part was reverted after the local ESM comparison; those native-only timings are not used as final-source validation here.
