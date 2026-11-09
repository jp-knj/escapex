# linux-arm64-gnu, v24.22.2

CPU: unknown.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 216.1 | 193.6 | 227.9 | 227.6 | 380.8 | -10.41% | -14.93% (fast-escape-html) |
| unchanged-16 | 56.5 | 55.1 | 61.7 | 58.9 | 114.3 | -2.45% | -6.34% (fast-escape-html) |
| first-16 | 151.5 | 143.4 | 165.8 | 165.8 | 238.3 | -5.34% | -13.47% (escape-html) |
| first-31 | 184.7 | 176.3 | 236.0 | 232.0 | 256.3 | -4.57% | -24.02% (fast-escape-html) |
| first-32 | 186.4 | 177.2 | 240.1 | 235.5 | 256.7 | -4.92% | -24.75% (fast-escape-html) |
| dense-31 | 490.8 | 466.3 | 466.1 | 463.8 | 1472.8 | -5.00% | +0.54% (fast-escape-html) |
| unchanged-short | 71.5 | 71.9 | 78.9 | 75.6 | 137.1 | +0.65% | -4.80% (fast-escape-html) |
| unchanged-long | 44110.1 | 44151.0 | 116811.9 | 116893.2 | 117083.2 | +0.09% | -62.20% (escape-html) |
| quoted-json | 77167.8 | 76943.0 | 233975.6 | 235210.3 | 747008.4 | -0.29% | -67.11% (escape-html) |
| japanese-emoji | 172061.7 | 173086.3 | 440007.0 | 430862.8 | 539153.7 | +0.60% | -59.83% (fast-escape-html) |
| long-body | 468248.7 | 467037.8 | 1364782.4 | 1359828.5 | 491571.0 | -0.26% | -4.99% (html-escaper) |
| dense-quotes | 105949.1 | 106062.4 | 311455.7 | 305159.3 | 1160430.4 | +0.11% | -65.24% (fast-escape-html) |
| first-24 | 194.9 | 183.4 | 219.5 | 215.9 | 248.7 | -5.92% | -15.07% (fast-escape-html) |
| last-31 | 152.5 | 141.7 | 161.5 | 162.5 | 248.7 | -7.06% | -12.26% (escape-html) |
| two-near-31 | 212.8 | 199.2 | 250.8 | 245.8 | 289.4 | -6.42% | -18.96% (fast-escape-html) |
| two-far-31 | 221.6 | 215.3 | 255.5 | 249.0 | 288.4 | -2.82% | -13.53% (fast-escape-html) |
| dense-32 | 503.8 | 502.0 | 479.9 | 479.6 | 1497.4 | -0.36% | +4.66% (fast-escape-html) |
| dense-255 | 1920.1 | 1946.5 | 2811.8 | 2789.3 | 10303.3 | +1.37% | -30.22% (fast-escape-html) |
| first-255 | 334.4 | 329.2 | 892.2 | 887.4 | 424.8 | -1.55% | -22.51% (html-escaper) |
| first-256 | 334.5 | 330.6 | 894.7 | 894.0 | 424.9 | -1.16% | -22.21% (html-escaper) |
| spaced-8 | 2232.4 | 2210.8 | 5799.7 | 5776.9 | 8359.1 | -0.97% | -61.73% (fast-escape-html) |
| spaced-32 | 2383.7 | 2369.1 | 4024.9 | 3993.4 | 2809.2 | -0.61% | -15.66% (html-escaper) |
| sparse-8192 | 6134.4 | 6096.5 | 24199.9 | 24253.5 | 6346.3 | -0.62% | -3.94% (html-escaper) |
| mixed-short | 291.1 | 285.0 | 361.7 | 359.9 | 509.9 | -2.09% | -20.79% (fast-escape-html) |
| mixed-long | 10058.3 | 10039.2 | 23873.8 | 23498.8 | 62624.6 | -0.19% | -57.28% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 210.4 | 202.8 | -3.59% |
| unchanged-16 | 53.5 | 55.9 | +4.54% |
| first-16 | 153.6 | 144.0 | -6.27% |
| first-31 | 180.5 | 176.3 | -2.31% |
| first-32 | 181.2 | 177.2 | -2.17% |
| dense-31 | 489.8 | 465.6 | -4.94% |
| unchanged-short | 68.6 | 72.2 | +5.27% |
| unchanged-long | 116966.3 | 116776.9 | -0.16% |
| quoted-json | 249209.3 | 249779.0 | +0.23% |
| japanese-emoji | 453789.9 | 450078.6 | -0.82% |
| long-body | 478915.6 | 470795.2 | -1.70% |
| dense-quotes | 329688.5 | 334240.8 | +1.38% |
| first-24 | 183.4 | 179.8 | -1.95% |
| last-31 | 143.0 | 138.8 | -2.91% |
| two-near-31 | 201.8 | 196.1 | -2.82% |
| two-far-31 | 211.6 | 212.7 | +0.51% |
| dense-32 | 503.9 | 508.2 | +0.85% |
| dense-255 | 3099.6 | 3105.1 | +0.18% |
| first-255 | 333.2 | 334.7 | +0.46% |
| first-256 | 334.1 | 334.6 | +0.12% |
| spaced-8 | 5894.6 | 5951.2 | +0.96% |
| spaced-32 | 2464.3 | 2400.2 | -2.60% |
| sparse-8192 | 6191.1 | 6230.9 | +0.64% |
| mixed-short | 311.4 | 310.1 | -0.40% |
| mixed-long | 18609.0 | 18695.9 | +0.47% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
