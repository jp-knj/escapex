# darwin-arm64, v24.22.2

CPU: Apple M1 (Virtual).

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 218.2 | 173.9 | 240.3 | 223.6 | 348.5 | -20.32% | -22.22% (fast-escape-html) |
| unchanged-16 | 57.0 | 55.6 | 57.1 | 56.0 | 100.0 | -2.35% | -0.69% (fast-escape-html) |
| first-16 | 164.3 | 150.7 | 158.4 | 144.5 | 218.5 | -8.29% | +4.32% (fast-escape-html) |
| first-31 | 188.5 | 163.2 | 238.8 | 228.2 | 203.7 | -13.41% | -19.88% (html-escaper) |
| first-32 | 177.1 | 175.6 | 245.7 | 241.3 | 224.0 | -0.84% | -21.60% (html-escaper) |
| dense-31 | 544.7 | 453.1 | 528.5 | 522.8 | 1432.0 | -16.82% | -13.33% (fast-escape-html) |
| unchanged-short | 81.8 | 83.2 | 83.8 | 83.3 | 127.9 | +1.75% | -0.12% (fast-escape-html) |
| unchanged-long | 50474.1 | 42176.8 | 135213.5 | 127043.5 | 133232.6 | -16.44% | -66.80% (fast-escape-html) |
| quoted-json | 103746.9 | 95937.0 | 268026.8 | 251278.3 | 610815.9 | -7.53% | -61.82% (fast-escape-html) |
| japanese-emoji | 196242.0 | 176612.3 | 677673.6 | 515033.6 | 677136.0 | -10.00% | -65.71% (fast-escape-html) |
| long-body | 415978.6 | 425331.0 | 1466229.6 | 1104311.4 | 399746.7 | +2.25% | +6.40% (html-escaper) |
| dense-quotes | 121754.8 | 104448.0 | 384205.4 | 378095.2 | 1219965.0 | -14.21% | -72.38% (fast-escape-html) |
| first-24 | 165.7 | 148.2 | 246.2 | 262.1 | 192.4 | -10.58% | -23.01% (html-escaper) |
| last-31 | 139.1 | 122.3 | 144.2 | 171.4 | 207.2 | -12.12% | -15.20% (escape-html) |
| two-near-31 | 195.0 | 178.9 | 260.6 | 266.2 | 258.2 | -8.23% | -30.70% (html-escaper) |
| two-far-31 | 178.7 | 211.8 | 264.5 | 273.8 | 243.1 | +18.48% | -12.90% (html-escaper) |
| dense-32 | 552.1 | 498.7 | 604.4 | 537.9 | 1411.9 | -9.67% | -7.29% (fast-escape-html) |
| dense-255 | 2072.8 | 2004.6 | 3498.6 | 3332.0 | 9535.5 | -3.29% | -39.84% (fast-escape-html) |
| first-255 | 334.3 | 301.2 | 928.9 | 1014.9 | 416.6 | -9.87% | -27.69% (html-escaper) |
| first-256 | 354.3 | 323.4 | 1001.0 | 975.3 | 408.8 | -8.71% | -20.89% (html-escaper) |
| spaced-8 | 3030.7 | 2532.1 | 7031.5 | 5859.7 | 8149.1 | -16.45% | -56.79% (fast-escape-html) |
| spaced-32 | 2556.7 | 2746.9 | 4502.6 | 4065.6 | 2594.3 | +7.44% | +5.88% (html-escaper) |
| sparse-8192 | 6042.2 | 5840.8 | 22975.8 | 27372.4 | 5678.6 | -3.33% | +2.86% (html-escaper) |
| mixed-short | 369.3 | 360.8 | 455.1 | 440.5 | 589.7 | -2.29% | -18.09% (fast-escape-html) |
| mixed-long | 9323.1 | 10988.1 | 24229.4 | 28476.3 | 63192.3 | +17.86% | -54.65% (escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 201.0 | 216.3 | +7.59% |
| unchanged-16 | 52.2 | 57.4 | +9.88% |
| first-16 | 162.5 | 130.6 | -19.63% |
| first-31 | 168.9 | 179.6 | +6.33% |
| first-32 | 185.6 | 184.2 | -0.75% |
| dense-31 | 491.7 | 502.0 | +2.10% |
| unchanged-short | 93.6 | 81.9 | -12.57% |
| unchanged-long | 128300.1 | 115747.2 | -9.78% |
| quoted-json | 250292.6 | 328482.2 | +31.24% |
| japanese-emoji | 630974.7 | 539064.4 | -14.57% |
| long-body | 446878.0 | 380048.1 | -14.95% |
| dense-quotes | 401108.4 | 357411.0 | -10.89% |
| first-24 | 215.8 | 162.6 | -24.65% |
| last-31 | 135.2 | 125.6 | -7.07% |
| two-near-31 | 173.8 | 177.5 | +2.09% |
| two-far-31 | 186.9 | 199.2 | +6.55% |
| dense-32 | 667.0 | 516.6 | -22.55% |
| dense-255 | 3874.9 | 4063.7 | +4.87% |
| first-255 | 321.7 | 311.9 | -3.05% |
| first-256 | 334.8 | 317.3 | -5.22% |
| spaced-8 | 6537.8 | 6513.6 | -0.37% |
| spaced-32 | 2592.2 | 2156.7 | -16.80% |
| sparse-8192 | 5911.3 | 5389.0 | -8.84% |
| mixed-short | 489.2 | 409.9 | -16.20% |
| mixed-long | 21542.6 | 21103.7 | -2.04% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
