# Library-only optimization on Apple M2

Node v24.22.2, darwin/arm64, Apple M2. Finished 2026-11-11T00:45:47.287Z (native comparison) and 2026-11-11T00:46:52.623Z (default ESM comparison).

Only html-escape was changed. The short scanner emits the first known match immediately and uses the ASCII entity table for subsequent units; the native entry delegates its long-input path to a private function. The long ESM scanner and Rust implementation match the predecessor. Astro sources and benchmark fixtures were not changed.

The native comparison uses five fresh processes per implementation and all 25 existing cases; the default ESM comparison uses three fresh processes per version. Every returned string is consumed with Buffer.byteLength. The tables show medians, not statistical significance tests. See the [protocol](../../library/README.md).

Native short input: 155.3 to 144.0 ns/call (-7.27%). The fastest competing library for this case was fast-escape-html, at 165.7 ns/call; current native was -13.08% relative to it.

The baseline was built from local single-commit snapshot `1e2bab396047c2ebd5afbf5890082a9cb6da9ae1`, whose production files match remote predecessor `cf51cdce642d3a45d044d0e5eb61f89dab48319e`. Final-source hashes match CI candidate `e093ab74a1b6c63573a9504a14e03482f2c41fe7`; local JSON has a null commit because the working checkout uses a separate Git directory. Source and protocol hashes were checked against the final files and every reported median was recalculated.

## Native public API

ns/call. Negative change means less time. The competitor reference is selected separately for each case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 155.3 | 144.0 | 167.0 | 165.7 | 237.9 | -7.27% | -13.08% (fast-escape-html) |
| unchanged-16 | 40.1 | 39.5 | 43.4 | 40.1 | 66.3 | -1.40% | -1.60% (fast-escape-html) |
| first-16 | 106.2 | 103.1 | 115.2 | 113.3 | 129.4 | -2.91% | -9.01% (fast-escape-html) |
| first-31 | 129.4 | 122.4 | 168.4 | 159.2 | 139.8 | -5.41% | -12.46% (html-escaper) |
| first-32 | 128.7 | 123.5 | 168.1 | 163.5 | 142.7 | -4.01% | -13.46% (html-escaper) |
| dense-31 | 362.5 | 351.1 | 380.7 | 367.2 | 935.3 | -3.15% | -4.38% (fast-escape-html) |
| unchanged-short | 55.3 | 54.1 | 58.8 | 54.8 | 81.3 | -2.27% | -1.44% (fast-escape-html) |
| unchanged-long | 28848.6 | 28860.3 | 92833.8 | 92977.7 | 93804.8 | +0.04% | -68.91% (escape-html) |
| quoted-json | 63949.7 | 63793.8 | 189552.5 | 183536.3 | 423915.1 | -0.24% | -65.24% (fast-escape-html) |
| japanese-emoji | 125019.1 | 123680.4 | 430834.0 | 412259.6 | 457888.6 | -1.07% | -70.00% (fast-escape-html) |
| long-body | 294960.6 | 293219.5 | 887189.8 | 888965.4 | 293003.3 | -0.59% | +0.07% (html-escaper) |
| dense-quotes | 77243.3 | 77101.8 | 263049.5 | 260689.4 | 645996.3 | -0.18% | -70.42% (fast-escape-html) |
| first-24 | 120.6 | 118.7 | 154.6 | 146.1 | 138.4 | -1.52% | -14.23% (html-escaper) |
| last-31 | 91.2 | 86.9 | 109.6 | 102.9 | 142.1 | -4.69% | -15.54% (fast-escape-html) |
| two-near-31 | 137.5 | 134.5 | 178.8 | 170.0 | 171.8 | -2.14% | -20.87% (fast-escape-html) |
| two-far-31 | 138.0 | 140.3 | 179.5 | 170.0 | 172.6 | +1.70% | -17.46% (fast-escape-html) |
| dense-32 | 347.8 | 343.5 | 369.7 | 356.5 | 948.8 | -1.23% | -3.65% (fast-escape-html) |
| dense-255 | 1487.9 | 1483.2 | 2446.1 | 2366.0 | 6794.1 | -0.32% | -37.31% (fast-escape-html) |
| first-255 | 240.7 | 240.3 | 675.3 | 634.0 | 268.9 | -0.18% | -10.66% (html-escaper) |
| first-256 | 242.3 | 242.5 | 677.3 | 634.9 | 270.1 | +0.08% | -10.23% (html-escaper) |
| spaced-8 | 1809.4 | 1803.1 | 4742.0 | 4349.7 | 5189.3 | -0.35% | -58.55% (fast-escape-html) |
| spaced-32 | 1618.8 | 1633.0 | 3077.3 | 2894.1 | 1776.8 | +0.88% | -8.10% (html-escaper) |
| sparse-8192 | 4019.9 | 4017.2 | 18679.1 | 17451.1 | 4090.3 | -0.07% | -1.79% (html-escaper) |
| mixed-short | 255.4 | 252.1 | 344.5 | 330.7 | 420.4 | -1.29% | -23.77% (fast-escape-html) |
| mixed-long | 6880.0 | 6828.8 | 18144.5 | 18858.7 | 35535.4 | -0.74% | -62.36% (escape-html) |

## Default ESM public API

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 154.8 | 146.0 | -5.70% |
| unchanged-16 | 39.4 | 39.5 | +0.29% |
| first-16 | 109.6 | 100.9 | -7.98% |
| first-31 | 126.9 | 122.3 | -3.60% |
| first-32 | 129.6 | 122.5 | -5.47% |
| dense-31 | 359.8 | 348.8 | -3.06% |
| unchanged-short | 54.2 | 54.4 | +0.46% |
| unchanged-long | 93610.6 | 93847.4 | +0.25% |
| quoted-json | 186168.3 | 185842.7 | -0.17% |
| japanese-emoji | 411713.6 | 412394.4 | +0.17% |
| long-body | 296824.3 | 297032.3 | +0.07% |
| dense-quotes | 267701.9 | 266908.4 | -0.30% |
| first-24 | 131.3 | 122.6 | -6.64% |
| last-31 | 94.0 | 90.7 | -3.53% |
| two-near-31 | 139.0 | 137.4 | -1.17% |
| two-far-31 | 143.8 | 145.4 | +1.12% |
| dense-32 | 358.8 | 350.0 | -2.45% |
| dense-255 | 2504.2 | 2494.1 | -0.40% |
| first-255 | 237.9 | 234.2 | -1.57% |
| first-256 | 232.3 | 230.1 | -0.95% |
| spaced-8 | 4673.5 | 4669.6 | -0.08% |
| spaced-32 | 1636.1 | 1635.7 | -0.02% |
| sparse-8192 | 4026.7 | 4010.3 | -0.41% |
| mixed-short | 304.2 | 302.2 | -0.63% |
| mixed-long | 13621.2 | 13592.2 | -0.21% |

All 22 ESM/Wasm/native, npm package, Worker, declaration and bundler tests passed; TypeScript checking also passed. See [test log](tests.log). The [eight-platform CI evaluation](../library-ci-20261111/README.md) separately checks Node 22/24/26.

All samples and ranges: [native JSON](api.json), [ESM JSON](esm.json), [baseline source hashes](before-source.json), and [candidate screening](screening/README.md). No final-run samples were discarded. The screening directory is exploratory evidence and includes rejected changes.

These API timings exclude imports and do not establish a 5% improvement in complete static-site builds. Improvements differ by case and host; no universal 5% improvement or all-case competitor win is claimed.
