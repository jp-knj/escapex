# win32-x64-msvc, v24.22.2

CPU: AMD EPYC 9V74 80-Core Processor                .

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 247.4 | 229.6 | 264.9 | 257.0 | 348.3 | -7.20% | -10.67% (fast-escape-html) |
| unchanged-16 | 49.3 | 48.3 | 49.4 | 48.6 | 88.5 | -2.00% | -0.54% (fast-escape-html) |
| first-16 | 186.3 | 176.8 | 202.8 | 197.1 | 190.7 | -5.09% | -7.30% (html-escaper) |
| first-31 | 226.5 | 204.6 | 260.4 | 254.5 | 215.5 | -9.70% | -5.07% (html-escaper) |
| first-32 | 224.2 | 212.2 | 260.2 | 253.3 | 213.8 | -5.35% | -0.74% (html-escaper) |
| dense-31 | 477.1 | 451.5 | 477.2 | 464.5 | 1354.4 | -5.37% | -2.81% (fast-escape-html) |
| unchanged-short | 68.0 | 65.1 | 65.7 | 65.3 | 110.4 | -4.38% | -0.38% (fast-escape-html) |
| unchanged-long | 58971.4 | 59053.4 | 148997.3 | 149113.8 | 149098.0 | +0.14% | -60.37% (escape-html) |
| quoted-json | 113072.2 | 89099.9 | 272005.7 | 258848.4 | 608581.6 | -21.20% | -65.58% (fast-escape-html) |
| japanese-emoji | 124479.3 | 124807.3 | 380340.6 | 376177.6 | 499561.6 | +0.26% | -66.82% (fast-escape-html) |
| long-body | 550005.5 | 554750.3 | 1135273.6 | 1132652.8 | 504409.9 | +0.86% | +9.98% (html-escaper) |
| dense-quotes | 112264.7 | 112256.4 | 353190.7 | 325138.6 | 949460.7 | -0.01% | -65.47% (fast-escape-html) |
| first-24 | 224.3 | 222.5 | 235.3 | 239.0 | 202.6 | -0.78% | +9.82% (html-escaper) |
| last-31 | 199.2 | 191.2 | 199.5 | 208.0 | 211.4 | -4.03% | -4.16% (escape-html) |
| two-near-31 | 242.8 | 256.6 | 263.6 | 265.5 | 253.1 | +5.68% | +1.37% (html-escaper) |
| two-far-31 | 249.9 | 251.8 | 271.0 | 266.5 | 248.4 | +0.74% | +1.35% (html-escaper) |
| dense-32 | 484.2 | 481.7 | 477.5 | 472.6 | 1380.6 | -0.53% | +1.93% (fast-escape-html) |
| dense-255 | 2075.9 | 2046.3 | 2824.5 | 2780.1 | 10638.2 | -1.43% | -26.39% (fast-escape-html) |
| first-255 | 449.3 | 449.6 | 847.7 | 837.9 | 411.8 | +0.07% | +9.18% (html-escaper) |
| first-256 | 446.8 | 438.8 | 840.0 | 841.2 | 412.9 | -1.79% | +6.27% (html-escaper) |
| spaced-8 | 2315.4 | 2333.0 | 5551.0 | 5493.1 | 7297.0 | +0.76% | -57.53% (fast-escape-html) |
| spaced-32 | 2365.3 | 2343.6 | 3453.5 | 3407.5 | 2588.7 | -0.92% | -9.47% (html-escaper) |
| sparse-8192 | 8327.2 | 8189.6 | 21703.4 | 21677.5 | 8269.5 | -1.65% | -0.97% (html-escaper) |
| mixed-short | 338.9 | 326.1 | 387.5 | 384.5 | 483.9 | -3.77% | -15.20% (fast-escape-html) |
| mixed-long | 10917.8 | 11155.6 | 23912.4 | 23730.9 | 60815.4 | +2.18% | -52.99% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 248.3 | 236.0 | -4.99% |
| unchanged-16 | 47.0 | 46.8 | -0.43% |
| first-16 | 198.5 | 186.0 | -6.31% |
| first-31 | 223.7 | 215.1 | -3.86% |
| first-32 | 227.4 | 218.1 | -4.09% |
| dense-31 | 465.5 | 452.3 | -2.84% |
| unchanged-short | 63.9 | 64.1 | +0.30% |
| unchanged-long | 149311.5 | 149217.4 | -0.06% |
| quoted-json | 268159.6 | 264546.6 | -1.35% |
| japanese-emoji | 386126.0 | 367162.2 | -4.91% |
| long-body | 546266.9 | 538885.3 | -1.35% |
| dense-quotes | 311058.7 | 360386.3 | +15.86% |
| first-24 | 224.9 | 212.2 | -5.67% |
| last-31 | 209.7 | 196.2 | -6.41% |
| two-near-31 | 254.0 | 243.4 | -4.18% |
| two-far-31 | 246.2 | 249.0 | +1.17% |
| dense-32 | 486.1 | 481.5 | -0.94% |
| dense-255 | 2956.1 | 3020.7 | +2.18% |
| first-255 | 423.3 | 425.0 | +0.40% |
| first-256 | 420.9 | 432.1 | +2.66% |
| spaced-8 | 5564.0 | 5487.1 | -1.38% |
| spaced-32 | 2440.7 | 2367.7 | -2.99% |
| sparse-8192 | 8558.0 | 8484.2 | -0.86% |
| mixed-short | 364.5 | 353.7 | -2.95% |
| mixed-long | 18122.3 | 18171.7 | +0.27% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
