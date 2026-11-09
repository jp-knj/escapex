# win32-arm64-msvc, v24.22.2

CPU: Cobalt 100.

ns/call; median of five fresh processes. Negative percentages mean less time. The competitor column selects the fastest of the three JavaScript libraries per case.

| Case | Before native | Native | escape-html | fast-escape-html | html-escaper | vs before | vs fastest competitor |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 438.7 | 415.9 | 441.5 | 437.5 | 556.0 | -5.21% | -4.95% (fast-escape-html) |
| unchanged-16 | 72.0 | 69.0 | 71.2 | 69.4 | 125.7 | -4.09% | -0.59% (fast-escape-html) |
| first-16 | 290.2 | 281.1 | 306.6 | 303.3 | 360.6 | -3.12% | -7.33% (fast-escape-html) |
| first-31 | 328.8 | 322.6 | 379.6 | 377.0 | 382.8 | -1.90% | -14.44% (fast-escape-html) |
| first-32 | 331.4 | 322.0 | 382.9 | 377.9 | 386.0 | -2.83% | -14.79% (fast-escape-html) |
| dense-31 | 1091.5 | 1075.7 | 1072.4 | 1064.5 | 2052.7 | -1.45% | +1.05% (fast-escape-html) |
| unchanged-short | 94.8 | 98.4 | 99.3 | 97.2 | 149.2 | +3.85% | +1.24% (fast-escape-html) |
| unchanged-long | 70613.7 | 70692.1 | 143425.8 | 143263.6 | 143550.3 | +0.11% | -50.66% (fast-escape-html) |
| quoted-json | 99281.0 | 98688.1 | 494105.3 | 495837.6 | 877547.7 | -0.60% | -80.03% (escape-html) |
| japanese-emoji | 160847.4 | 157390.7 | 844398.3 | 870530.3 | 808432.8 | -2.15% | -80.53% (html-escaper) |
| long-body | 565142.7 | 563755.3 | 1470025.9 | 1448152.4 | 512531.9 | -0.25% | +9.99% (html-escaper) |
| dense-quotes | 131023.8 | 130565.6 | 681966.7 | 683856.0 | 1347669.3 | -0.35% | -80.85% (escape-html) |
| first-24 | 342.8 | 330.3 | 356.5 | 349.0 | 381.2 | -3.66% | -5.38% (fast-escape-html) |
| last-31 | 318.0 | 306.8 | 317.4 | 312.1 | 379.9 | -3.55% | -1.70% (fast-escape-html) |
| two-near-31 | 369.6 | 358.0 | 391.7 | 382.7 | 432.7 | -3.15% | -6.46% (fast-escape-html) |
| two-far-31 | 413.0 | 396.3 | 419.8 | 411.1 | 430.6 | -4.03% | -3.58% (fast-escape-html) |
| dense-32 | 1154.5 | 1142.0 | 1083.9 | 1076.7 | 2085.4 | -1.08% | +6.07% (fast-escape-html) |
| dense-255 | 2493.9 | 2488.9 | 7010.9 | 6984.3 | 13876.4 | -0.20% | -64.36% (fast-escape-html) |
| first-255 | 564.3 | 548.2 | 1069.3 | 1062.1 | 586.8 | -2.86% | -6.58% (html-escaper) |
| first-256 | 562.4 | 548.1 | 1078.6 | 1077.5 | 594.6 | -2.54% | -7.82% (html-escaper) |
| spaced-8 | 2720.1 | 2710.8 | 9440.1 | 9541.5 | 11310.5 | -0.34% | -71.28% (escape-html) |
| spaced-32 | 3447.3 | 3464.6 | 4985.8 | 4950.2 | 3851.4 | +0.50% | -10.04% (html-escaper) |
| sparse-8192 | 7789.5 | 7773.8 | 25879.0 | 25939.9 | 7974.1 | -0.20% | -2.51% (html-escaper) |
| mixed-short | 579.3 | 567.2 | 716.6 | 716.7 | 848.1 | -2.08% | -20.85% (escape-html) |
| mixed-long | 13357.4 | 13823.9 | 43024.1 | 42649.5 | 73532.9 | +3.49% | -67.59% (fast-escape-html) |

## Default ESM entry

ns/call; median of three fresh processes per version.

| Case | Before ESM | ESM | Change |
|---|---:|---:|---:|
| short | 426.3 | 417.4 | -2.08% |
| unchanged-16 | 68.4 | 68.0 | -0.45% |
| first-16 | 292.6 | 286.1 | -2.23% |
| first-31 | 328.8 | 318.2 | -3.22% |
| first-32 | 331.3 | 321.4 | -2.97% |
| dense-31 | 1091.9 | 1069.4 | -2.06% |
| unchanged-short | 95.1 | 94.6 | -0.54% |
| unchanged-long | 143276.1 | 143358.0 | +0.06% |
| quoted-json | 511081.6 | 511169.7 | +0.02% |
| japanese-emoji | 900578.7 | 864355.5 | -4.02% |
| long-body | 579181.9 | 574319.1 | -0.84% |
| dense-quotes | 702718.9 | 702134.0 | -0.08% |
| first-24 | 318.8 | 320.3 | +0.46% |
| last-31 | 296.8 | 299.8 | +1.04% |
| two-near-31 | 347.7 | 349.8 | +0.60% |
| two-far-31 | 377.0 | 379.2 | +0.58% |
| dense-32 | 1115.4 | 1118.6 | +0.29% |
| dense-255 | 7333.3 | 7421.3 | +1.20% |
| first-255 | 528.0 | 532.1 | +0.78% |
| first-256 | 529.2 | 533.9 | +0.88% |
| spaced-8 | 9564.2 | 9544.9 | -0.20% |
| spaced-32 | 3453.1 | 3424.4 | -0.83% |
| sparse-8192 | 7762.6 | 7773.3 | +0.14% |
| mixed-short | 686.2 | 692.5 | +0.92% |
| mixed-long | 38019.3 | 37924.3 | -0.25% |

All raw samples and ranges: [native API JSON](library-tuning/results/api.json), [default ESM JSON](library-tuning/results/esm.json). No rounds were discarded.
