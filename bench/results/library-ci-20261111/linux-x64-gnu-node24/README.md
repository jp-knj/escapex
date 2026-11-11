# linux-x64-gnu, v24.22.2

CPU: AMD EPYC 9V45 96-Core Processor.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 118.2 | 105.7 | 124.8 | 123.1 | 213.2 | -10.58% | -14.16% (fast-escape-html) |
| unchanged-16 | 34.1 | 32.2 | 33.3 | 32.8 | 59.7 | -5.68% | -1.84% (fast-escape-html) |
| first-16 | 71.8 | 69.1 | 80.6 | 80.6 | 125.5 | -3.82% | -14.30% (escape-html) |
| first-31 | 90.0 | 87.6 | 121.2 | 123.6 | 136.3 | -2.74% | -27.74% (escape-html) |
| first-32 | 88.8 | 84.9 | 123.3 | 123.2 | 137.5 | -4.37% | -31.10% (fast-escape-html) |
| dense-31 | 301.5 | 295.8 | 322.8 | 325.0 | 870.7 | -1.87% | -8.35% (escape-html) |
| unchanged-short | 44.8 | 44.6 | 46.3 | 44.9 | 72.8 | -0.50% | -0.68% (fast-escape-html) |
| unchanged-long | 22514.2 | 22399.9 | 218349.9 | 221632.6 | 222341.6 | -0.51% | -89.74% (escape-html) |
| quoted-json | 46743.3 | 47142.7 | 162517.3 | 165522.8 | 458462.9 | +0.85% | -70.99% (escape-html) |
| japanese-emoji | 97486.9 | 97746.2 | 264100.2 | 257117.9 | 335275.5 | +0.27% | -61.98% (fast-escape-html) |
| long-body | 670015.9 | 620268.7 | 722424.9 | 711654.0 | 678547.7 | -7.42% | -8.59% (html-escaper) |
| dense-quotes | 63844.1 | 63848.6 | 215371.4 | 217232.9 | 663582.0 | +0.01% | -70.35% (escape-html) |
| first-24 | 89.3 | 90.0 | 104.2 | 102.4 | 127.7 | +0.84% | -12.12% (fast-escape-html) |
| last-31 | 70.9 | 73.2 | 80.5 | 77.0 | 135.8 | +3.27% | -4.97% (fast-escape-html) |
| two-near-31 | 99.6 | 102.0 | 127.7 | 125.3 | 166.8 | +2.35% | -18.60% (fast-escape-html) |
| two-far-31 | 103.5 | 105.4 | 131.0 | 130.9 | 160.6 | +1.84% | -19.46% (fast-escape-html) |
| dense-32 | 302.0 | 307.1 | 317.2 | 321.9 | 924.5 | +1.67% | -3.19% (escape-html) |
| dense-255 | 1231.7 | 1193.0 | 2157.8 | 2218.0 | 6579.9 | -3.14% | -44.71% (escape-html) |
| first-255 | 204.0 | 205.2 | 486.8 | 475.9 | 258.0 | +0.62% | -20.47% (html-escaper) |
| first-256 | 204.6 | 210.3 | 486.9 | 468.2 | 266.5 | +2.75% | -21.11% (html-escaper) |
| spaced-8 | 1329.9 | 1374.5 | 3862.2 | 3654.3 | 5044.8 | +3.36% | -62.39% (fast-escape-html) |
| spaced-32 | 1629.8 | 1625.9 | 2523.1 | 2431.4 | 1811.9 | -0.24% | -10.27% (html-escaper) |
| sparse-8192 | 5162.8 | 5108.1 | 12356.1 | 12018.1 | 3805.6 | -1.06% | +34.23% (html-escaper) |
| mixed-short | 189.5 | 184.3 | 234.6 | 222.2 | 322.6 | -2.76% | -17.07% (fast-escape-html) |
| mixed-long | 6329.2 | 6593.2 | 17556.4 | 17351.6 | 38169.8 | +4.17% | -62.00% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 109.9 | 106.6 | -2.97% |
| unchanged-16 | 29.2 | 30.4 | +4.06% |
| first-16 | 72.1 | 67.1 | -6.89% |
| first-31 | 91.4 | 86.5 | -5.35% |
| first-32 | 87.3 | 84.4 | -3.31% |
| dense-31 | 313.0 | 289.4 | -7.53% |
| unchanged-short | 42.6 | 42.8 | +0.56% |
| unchanged-long | 219862.3 | 216832.5 | -1.38% |
| quoted-json | 161052.6 | 164230.2 | +1.97% |
| japanese-emoji | 254640.5 | 283292.0 | +11.25% |
| long-body | 671021.6 | 566375.9 | -15.59% |
| dense-quotes | 233400.9 | 219260.0 | -6.06% |
| first-24 | 94.2 | 90.3 | -4.06% |
| last-31 | 71.8 | 68.8 | -4.25% |
| two-near-31 | 98.9 | 94.2 | -4.78% |
| two-far-31 | 107.2 | 103.2 | -3.76% |
| dense-32 | 314.2 | 303.4 | -3.44% |
| dense-255 | 2185.3 | 2182.8 | -0.11% |
| first-255 | 211.4 | 203.1 | -3.90% |
| first-256 | 196.5 | 202.2 | +2.91% |
| spaced-8 | 3713.3 | 3673.5 | -1.07% |
| spaced-32 | 1615.4 | 1601.0 | -0.89% |
| sparse-8192 | 4890.3 | 4981.8 | +1.87% |
| mixed-short | 191.9 | 191.0 | -0.46% |
| mixed-long | 12521.0 | 13331.6 | +6.47% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
