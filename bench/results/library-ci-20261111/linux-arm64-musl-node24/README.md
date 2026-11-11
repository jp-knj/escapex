# linux-arm64-musl, v24.22.2

CPU: unknown.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 236.4 | 212.3 | 260.4 | 258.6 | 383.1 | -10.21% | -17.90% (fast-escape-html) |
| unchanged-16 | 62.1 | 58.8 | 66.3 | 60.2 | 122.0 | -5.24% | -2.24% (fast-escape-html) |
| first-16 | 158.3 | 148.8 | 180.5 | 180.7 | 248.6 | -6.01% | -17.55% (escape-html) |
| first-31 | 196.1 | 188.0 | 256.6 | 256.4 | 267.4 | -4.17% | -26.68% (fast-escape-html) |
| first-32 | 200.5 | 189.6 | 260.1 | 258.2 | 267.2 | -5.44% | -26.58% (fast-escape-html) |
| dense-31 | 559.7 | 534.6 | 541.0 | 538.7 | 1489.5 | -4.48% | -0.76% (fast-escape-html) |
| unchanged-short | 82.9 | 75.7 | 84.4 | 79.3 | 147.5 | -8.71% | -4.63% (fast-escape-html) |
| unchanged-long | 70596.6 | 69498.0 | 142635.5 | 142734.8 | 142773.0 | -1.56% | -51.28% (escape-html) |
| quoted-json | 193494.3 | 194334.9 | 255268.2 | 254708.1 | 762624.0 | +0.43% | -23.70% (fast-escape-html) |
| japanese-emoji | 268865.8 | 268880.4 | 447041.8 | 429388.0 | 572711.8 | +0.01% | -37.38% (fast-escape-html) |
| long-body | 566228.4 | 559724.1 | 1473735.5 | 1440701.7 | 573390.6 | -1.15% | -2.38% (html-escaper) |
| dense-quotes | 270527.2 | 268112.0 | 334222.2 | 328539.5 | 1160488.4 | -0.89% | -18.39% (fast-escape-html) |
| first-24 | 196.6 | 191.8 | 212.0 | 209.7 | 245.3 | -2.43% | -8.51% (fast-escape-html) |
| last-31 | 161.5 | 153.9 | 161.2 | 164.3 | 248.6 | -4.67% | -4.48% (escape-html) |
| two-near-31 | 221.2 | 216.1 | 256.5 | 255.1 | 288.5 | -2.32% | -15.32% (fast-escape-html) |
| two-far-31 | 232.2 | 228.0 | 262.6 | 257.8 | 286.3 | -1.84% | -11.58% (fast-escape-html) |
| dense-32 | 552.7 | 555.7 | 509.0 | 504.1 | 1448.6 | +0.55% | +10.24% (fast-escape-html) |
| dense-255 | 2687.1 | 2652.5 | 3054.0 | 3012.8 | 9994.6 | -1.29% | -11.96% (fast-escape-html) |
| first-255 | 399.4 | 396.3 | 938.5 | 941.4 | 466.1 | -0.77% | -14.97% (html-escaper) |
| first-256 | 400.5 | 397.2 | 939.7 | 941.3 | 467.1 | -0.82% | -14.96% (html-escaper) |
| spaced-8 | 9327.3 | 2958.2 | 6042.9 | 6056.4 | 7585.5 | -68.28% | -51.05% (escape-html) |
| spaced-32 | 2596.9 | 2580.3 | 4126.4 | 4076.7 | 2766.2 | -0.64% | -6.72% (html-escaper) |
| sparse-8192 | 7749.8 | 7723.7 | 25675.0 | 25769.7 | 7753.4 | -0.34% | -0.38% (html-escaper) |
| mixed-short | 305.4 | 300.2 | 362.8 | 364.5 | 516.1 | -1.71% | -17.27% (escape-html) |
| mixed-long | 20793.2 | 20499.7 | 25735.3 | 25363.9 | 64453.4 | -1.41% | -19.18% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 238.8 | 227.8 | -4.62% |
| unchanged-16 | 56.3 | 57.5 | +2.24% |
| first-16 | 162.5 | 152.7 | -6.02% |
| first-31 | 195.5 | 191.0 | -2.30% |
| first-32 | 197.2 | 192.5 | -2.36% |
| dense-31 | 554.9 | 537.0 | -3.23% |
| unchanged-short | 74.7 | 73.8 | -1.20% |
| unchanged-long | 142308.6 | 142069.1 | -0.17% |
| quoted-json | 266285.0 | 268050.1 | +0.66% |
| japanese-emoji | 452649.0 | 454577.0 | +0.43% |
| long-body | 563818.4 | 560950.9 | -0.51% |
| dense-quotes | 348965.3 | 350139.5 | +0.34% |
| first-24 | 186.9 | 184.4 | -1.31% |
| last-31 | 148.0 | 145.3 | -1.77% |
| two-near-31 | 208.4 | 202.8 | -2.71% |
| two-far-31 | 217.3 | 223.2 | +2.73% |
| dense-32 | 533.9 | 542.0 | +1.51% |
| dense-255 | 3332.1 | 3319.4 | -0.38% |
| first-255 | 382.6 | 381.7 | -0.23% |
| first-256 | 380.3 | 381.7 | +0.36% |
| spaced-8 | 6156.1 | 6152.7 | -0.05% |
| spaced-32 | 2513.0 | 2526.9 | +0.55% |
| sparse-8192 | 7620.8 | 7627.2 | +0.08% |
| mixed-short | 326.5 | 324.4 | -0.63% |
| mixed-long | 20466.4 | 20456.2 | -0.05% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
