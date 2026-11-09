# linux-x64-musl, v24.22.2

CPU: AMD EPYC 9V74 80-Core Processor.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 196.2 | 178.8 | 219.6 | 221.3 | 348.8 | -8.88% | -18.57% (escape-html) |
| unchanged-16 | 48.7 | 47.2 | 47.5 | 48.5 | 89.2 | -3.02% | -0.56% (escape-html) |
| first-16 | 114.2 | 107.9 | 132.4 | 131.7 | 191.7 | -5.45% | -18.04% (fast-escape-html) |
| first-31 | 142.0 | 136.6 | 182.1 | 181.4 | 210.8 | -3.79% | -24.67% (fast-escape-html) |
| first-32 | 142.9 | 138.0 | 187.4 | 186.6 | 214.3 | -3.45% | -26.04% (fast-escape-html) |
| dense-31 | 510.9 | 488.7 | 519.5 | 524.6 | 1314.6 | -4.35% | -5.92% (escape-html) |
| unchanged-short | 65.0 | 63.7 | 64.2 | 63.3 | 110.8 | -1.96% | +0.62% (fast-escape-html) |
| unchanged-long | 51704.4 | 51955.0 | 142159.2 | 142240.6 | 142767.1 | +0.48% | -63.45% (escape-html) |
| quoted-json | 220022.4 | 219057.3 | 294447.1 | 288697.4 | 783243.0 | -0.44% | -24.12% (fast-escape-html) |
| japanese-emoji | 310561.0 | 304209.4 | 425706.8 | 423097.4 | 580755.7 | -2.05% | -28.10% (fast-escape-html) |
| long-body | 602600.9 | 593857.3 | 1177821.2 | 1182694.1 | 600533.6 | -1.45% | -1.11% (html-escaper) |
| dense-quotes | 301039.2 | 298527.4 | 368387.6 | 366710.7 | 1133170.4 | -0.83% | -18.59% (fast-escape-html) |
| first-24 | 140.5 | 136.1 | 154.4 | 152.2 | 191.1 | -3.13% | -10.55% (fast-escape-html) |
| last-31 | 117.8 | 113.4 | 125.8 | 121.7 | 204.6 | -3.70% | -6.85% (fast-escape-html) |
| two-near-31 | 161.6 | 155.3 | 181.5 | 183.8 | 232.5 | -3.91% | -14.43% (escape-html) |
| two-far-31 | 171.3 | 167.3 | 192.6 | 187.5 | 237.4 | -2.35% | -10.77% (fast-escape-html) |
| dense-32 | 509.4 | 498.1 | 496.5 | 497.0 | 1329.3 | -2.21% | +0.33% (escape-html) |
| dense-255 | 2245.5 | 2231.1 | 3560.8 | 3551.2 | 9457.7 | -0.64% | -37.17% (fast-escape-html) |
| first-255 | 352.7 | 352.2 | 748.2 | 744.6 | 407.5 | -0.17% | -13.57% (html-escaper) |
| first-256 | 351.6 | 349.4 | 750.7 | 748.1 | 410.8 | -0.62% | -14.96% (html-escaper) |
| spaced-8 | 12855.3 | 12749.1 | 6842.1 | 6635.1 | 8292.4 | -0.83% | +92.15% (fast-escape-html) |
| spaced-32 | 2530.9 | 2533.0 | 3677.9 | 3575.8 | 2809.6 | +0.08% | -9.84% (html-escaper) |
| sparse-8192 | 7786.0 | 7799.9 | 21120.3 | 21104.0 | 7946.1 | +0.18% | -1.84% (html-escaper) |
| mixed-short | 263.0 | 260.9 | 324.7 | 313.4 | 459.6 | -0.81% | -16.74% (fast-escape-html) |
| mixed-long | 22381.4 | 21834.4 | 27027.7 | 26881.1 | 61929.2 | -2.44% | -18.77% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 198.0 | 188.7 | -4.69% |
| unchanged-16 | 45.7 | 46.3 | +1.35% |
| first-16 | 118.7 | 112.9 | -4.91% |
| first-31 | 146.9 | 140.2 | -4.53% |
| first-32 | 147.6 | 142.3 | -3.62% |
| dense-31 | 510.5 | 481.8 | -5.63% |
| unchanged-short | 62.2 | 62.2 | +0.11% |
| unchanged-long | 142035.3 | 142091.0 | +0.04% |
| quoted-json | 295982.3 | 295776.8 | -0.07% |
| japanese-emoji | 417541.6 | 419030.5 | +0.36% |
| long-body | 576706.3 | 577402.2 | +0.12% |
| dense-quotes | 371157.6 | 370054.9 | -0.30% |
| first-24 | 137.4 | 132.4 | -3.65% |
| last-31 | 112.7 | 111.6 | -0.95% |
| two-near-31 | 162.8 | 151.8 | -6.80% |
| two-far-31 | 164.4 | 164.1 | -0.20% |
| dense-32 | 496.5 | 502.0 | +1.12% |
| dense-255 | 3687.1 | 3691.2 | +0.11% |
| first-255 | 329.9 | 322.7 | -2.17% |
| first-256 | 326.1 | 324.1 | -0.63% |
| spaced-8 | 6808.9 | 6757.7 | -0.75% |
| spaced-32 | 2507.8 | 2510.5 | +0.11% |
| sparse-8192 | 7688.5 | 7673.9 | -0.19% |
| mixed-short | 286.6 | 282.3 | -1.49% |
| mixed-long | 21558.0 | 21556.4 | -0.01% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
