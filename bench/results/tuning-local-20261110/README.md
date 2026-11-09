# Local packed-copy evaluation

Apple M2, macOS ARM64, Node 24.22.2, Rust 1.91.1. All samples are retained. The candidate kernel is the same as the [24-environment CI evaluation](../tuning-ci-20261110/README.md).

## Native API, before and after

| Case | Before ns | Native ns | Change |
|---|---:|---:|---:|
| short | 157.4 | 154.6 | -1.79% |
| quoted-json | 75686.2 | 64163.8 | -15.22% |
| japanese-emoji | 134579.7 | 124488.0 | -7.50% |
| long-body | 304498.8 | 294804.8 | -3.18% |
| dense-quotes | 105268.6 | 80403.9 | -23.62% |
| mixed-long | 7718.4 | 6824.5 | -11.58% |

Three fresh processes per variant, unchanged 25-case competitor worker. Inputs shorter than 128 units use identical JavaScript in both APIs; their differences do not measure the Rust change.

## Actual SSG call replay

| Site | Before ms/corpus | Native ms/corpus | Change |
|---|---:|---:|---:|
| articles | 0.505 | 0.502 | -0.54% |
| catalog | 8.425 | 8.376 | -0.57% |
| props | 28.529 | 27.015 | -5.31% |

Five fresh processes per variant. The full article corpus has 6,000 calls, the catalog 33,250, and props 384. Replay includes output byte-length consumption; it is not a full build or a strict cost upper bound.

## Complete static builds

| Site | Before ms | Native ms | Fastest competitor ms | Native vs before | Native vs competitor |
|---|---:|---:|---:|---:|---:|
| articles | 903.221 | 912.443 | 903.182 (html-escaper) | +1.02% | +1.03% |
| catalog | 721.663 | 719.966 | 721.034 (fast-escape-html) | -0.24% | -0.15% |
| props | 872.365 | 862.630 | 920.730 (escape-html) | -1.12% | -6.31% |

Five complete builds per variant and site, one rendering thread. All static output hashes match. The local large-props comparison is 6.31% below its fastest competitor, but the eight CI hosts did not reproduce a 5% large-props full-build win. This local result therefore does not establish the all-environment goal.

## Provenance

The local corpus and complete-build runs began before the benchmark metadata was refactored to load `expected-inputs.json` instead of extracting the same profiles from the preceding local SSG result. Their recorded hashes refer to the two exact files retained in `protocol/`; both snapshots were verified against those hashes. The timed SSG harness, actual inputs, native binaries, API code and correctness checks did not change. The subsequent local microbenchmark and all CI runs use the final tracked benchmark metadata. No raw measurements or recorded hashes were rewritten.

The two experimental variants that also grouped capacity checks or paired SIMD comparisons were not adopted: local props corpus medians were 27.296 ms and 27.070 ms, compared with 27.250 ms for the simpler padded-copy trial. Their independent baselines differed; these screening values are not a paired ranking. The adopted implementation keeps the original CPU masks and per-match capacity check.
