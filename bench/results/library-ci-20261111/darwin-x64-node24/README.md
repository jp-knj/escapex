# darwin-x64, v24.19.0

CPU: Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 394.6 | 355.8 | 388.6 | 357.5 | 653.1 | -9.84% | -0.49% (fast-escape-html) |
| unchanged-16 | 106.7 | 99.8 | 94.9 | 85.4 | 169.9 | -6.55% | +16.77% (fast-escape-html) |
| first-16 | 271.2 | 239.6 | 321.1 | 297.9 | 430.3 | -11.62% | -19.57% (fast-escape-html) |
| first-31 | 305.0 | 287.6 | 421.9 | 452.2 | 478.5 | -5.69% | -31.83% (escape-html) |
| first-32 | 324.1 | 286.9 | 383.4 | 497.0 | 387.6 | -11.49% | -25.18% (escape-html) |
| dense-31 | 1096.6 | 900.3 | 931.1 | 1016.4 | 2394.8 | -17.90% | -3.31% (escape-html) |
| unchanged-short | 149.1 | 135.3 | 137.6 | 160.2 | 190.7 | -9.25% | -1.66% (escape-html) |
| unchanged-long | 52023.2 | 55083.0 | 254690.3 | 205779.6 | 192202.5 | +5.88% | -71.34% (html-escaper) |
| quoted-json | 163320.5 | 174231.7 | 547345.9 | 514294.4 | 1056898.9 | +6.68% | -66.12% (fast-escape-html) |
| japanese-emoji | 303872.4 | 339044.7 | 962308.0 | 937535.1 | 1195274.3 | +11.57% | -63.84% (fast-escape-html) |
| long-body | 778216.9 | 923230.6 | 1855288.1 | 1978812.1 | 805532.3 | +18.63% | +14.61% (html-escaper) |
| dense-quotes | 180350.8 | 178762.5 | 716536.4 | 681405.9 | 1725847.6 | -0.88% | -73.77% (fast-escape-html) |
| first-24 | 331.2 | 274.4 | 355.7 | 375.0 | 378.1 | -17.14% | -22.86% (escape-html) |
| last-31 | 277.1 | 234.5 | 281.7 | 279.2 | 412.6 | -15.36% | -16.00% (fast-escape-html) |
| two-near-31 | 345.9 | 321.2 | 365.2 | 391.0 | 460.1 | -7.16% | -12.07% (escape-html) |
| two-far-31 | 325.4 | 333.5 | 387.2 | 403.0 | 511.5 | +2.49% | -13.87% (escape-html) |
| dense-32 | 1040.9 | 1034.6 | 1089.2 | 1124.7 | 2494.6 | -0.60% | -5.01% (escape-html) |
| dense-255 | 3558.5 | 3356.0 | 6132.4 | 7774.4 | 16375.6 | -5.69% | -45.27% (escape-html) |
| first-255 | 568.7 | 582.4 | 1306.5 | 1691.6 | 628.8 | +2.42% | -7.38% (html-escaper) |
| first-256 | 565.3 | 553.8 | 1227.8 | 1552.4 | 637.2 | -2.03% | -13.08% (html-escaper) |
| spaced-8 | 4830.2 | 5179.9 | 12967.5 | 9679.1 | 15005.3 | +7.24% | -46.48% (fast-escape-html) |
| spaced-32 | 4313.5 | 4616.9 | 8091.2 | 7631.4 | 4749.9 | +7.03% | -2.80% (html-escaper) |
| sparse-8192 | 10214.8 | 10275.6 | 46121.3 | 37256.8 | 10159.6 | +0.60% | +1.14% (html-escaper) |
| mixed-short | 541.5 | 648.6 | 700.2 | 702.3 | 876.5 | +19.78% | -7.37% (escape-html) |
| mixed-long | 15536.5 | 16119.4 | 42591.0 | 53432.8 | 96261.4 | +3.75% | -62.15% (escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 336.5 | 343.3 | +1.99% |
| unchanged-16 | 76.4 | 86.8 | +13.67% |
| first-16 | 246.4 | 247.0 | +0.24% |
| first-31 | 263.1 | 294.6 | +11.99% |
| first-32 | 291.4 | 269.1 | -7.65% |
| dense-31 | 1003.6 | 886.1 | -11.71% |
| unchanged-short | 118.8 | 124.1 | +4.40% |
| unchanged-long | 193201.7 | 189627.7 | -1.85% |
| quoted-json | 476259.3 | 461575.3 | -3.08% |
| japanese-emoji | 746940.1 | 1013050.2 | +35.63% |
| long-body | 758297.1 | 709687.5 | -6.41% |
| dense-quotes | 652520.7 | 594376.7 | -8.91% |
| first-24 | 248.3 | 253.7 | +2.19% |
| last-31 | 212.6 | 212.8 | +0.07% |
| two-near-31 | 298.2 | 310.4 | +4.10% |
| two-far-31 | 298.9 | 294.8 | -1.37% |
| dense-32 | 920.8 | 849.2 | -7.77% |
| dense-255 | 6395.4 | 6140.6 | -3.98% |
| first-255 | 447.1 | 555.4 | +24.23% |
| first-256 | 516.7 | 558.4 | +8.08% |
| spaced-8 | 10640.0 | 12604.1 | +18.46% |
| spaced-32 | 4791.8 | 5286.7 | +10.33% |
| sparse-8192 | 9807.6 | 11074.7 | +12.92% |
| mixed-short | 577.8 | 588.2 | +1.79% |
| mixed-long | 34642.4 | 37653.3 | +8.69% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
