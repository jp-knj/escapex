# Rust buffer text/attribute measurements

Positive changes mean more time per call. All percentages compare process medians.

| Environment | Candidate | Processes per variant | Cases over +5% | Worst change |
| --- | --- | ---: | ---: | ---: |
| darwin-arm64 | reuse | 10 | 1 | 7.10% |
| darwin-x64 | reuse | 5 | 0 | 1.39% |
| linux-arm64-gnu | reuse | 5 | 0 | 2.37% |
| linux-x64-gnu | reuse | 5 | 0 | 0.44% |
| linux-arm64-musl | reuse | 5 | 0 | 0.34% |
| linux-x64-musl | reuse | 5 | 0 | 0.31% |
| win32-arm64-msvc | reuse | 5 | 0 | 0.24% |
| win32-x64-msvc | reuse | 5 | 0 | 3.36% |
| local | reuse | 5 | 0 | 4.50% |

## darwin-arm64: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 14789.06 | 14884.00 | 0.64% |
| escapeText-dense-256 | 914.57 | 740.80 | -19.00% |
| escapeText-dense-8192 | 15582.62 | 15182.94 | -2.56% |
| escapeText-sparse-8192 | 5984.54 | 6197.90 | 3.57% |
| escapeText-unicode-8192 | 20126.56 | 20733.36 | 3.01% |
| escapeText-mixed-sizes | 10814.41 | 11582.37 | 7.10% |
| escapeAttribute-unchanged | 14931.19 | 14814.64 | -0.78% |
| escapeAttribute-dense-256 | 1581.12 | 1297.52 | -17.94% |
| escapeAttribute-dense-8192 | 34102.34 | 32577.82 | -4.47% |
| escapeAttribute-sparse-8192 | 7281.61 | 7278.43 | -0.04% |
| escapeAttribute-unicode-8192 | 20292.92 | 20188.61 | -0.51% |
| escapeAttribute-mixed-sizes | 11152.04 | 11106.34 | -0.41% |

## darwin-x64: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 22910.90 | 22248.44 | -2.89% |
| escapeText-dense-256 | 3077.84 | 1936.33 | -37.09% |
| escapeText-dense-8192 | 39421.20 | 34713.81 | -11.94% |
| escapeText-sparse-8192 | 8705.24 | 7304.68 | -16.09% |
| escapeText-unicode-8192 | 44670.79 | 42021.04 | -5.93% |
| escapeText-mixed-sizes | 24559.62 | 20908.80 | -14.87% |
| escapeAttribute-unchanged | 23064.18 | 21071.17 | -8.64% |
| escapeAttribute-dense-256 | 3391.79 | 2845.31 | -16.11% |
| escapeAttribute-dense-8192 | 59174.89 | 52891.36 | -10.62% |
| escapeAttribute-sparse-8192 | 11575.87 | 10119.85 | -12.58% |
| escapeAttribute-unicode-8192 | 45041.20 | 45665.68 | 1.39% |
| escapeAttribute-mixed-sizes | 21719.46 | 21135.98 | -2.69% |

## linux-arm64-gnu: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 12698.17 | 12710.20 | 0.09% |
| escapeText-dense-256 | 978.62 | 855.12 | -12.62% |
| escapeText-dense-8192 | 18067.92 | 17788.74 | -1.55% |
| escapeText-sparse-8192 | 6582.91 | 6048.68 | -8.12% |
| escapeText-unicode-8192 | 17119.42 | 17484.37 | 2.13% |
| escapeText-mixed-sizes | 9836.23 | 10069.31 | 2.37% |
| escapeAttribute-unchanged | 12731.67 | 12718.77 | -0.10% |
| escapeAttribute-dense-256 | 1748.07 | 1533.06 | -12.30% |
| escapeAttribute-dense-8192 | 38586.36 | 38937.57 | 0.91% |
| escapeAttribute-sparse-8192 | 9660.40 | 9576.90 | -0.86% |
| escapeAttribute-unicode-8192 | 17729.05 | 17649.44 | -0.45% |
| escapeAttribute-mixed-sizes | 10014.40 | 10099.76 | 0.85% |

## linux-x64-gnu: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 16115.70 | 16182.22 | 0.41% |
| escapeText-dense-256 | 1043.37 | 906.14 | -13.15% |
| escapeText-dense-8192 | 18651.96 | 18475.53 | -0.95% |
| escapeText-sparse-8192 | 5202.25 | 4597.68 | -11.62% |
| escapeText-unicode-8192 | 21048.23 | 20732.13 | -1.50% |
| escapeText-mixed-sizes | 11863.07 | 11739.75 | -1.04% |
| escapeAttribute-unchanged | 16160.56 | 16231.82 | 0.44% |
| escapeAttribute-dense-256 | 1734.50 | 1458.80 | -15.90% |
| escapeAttribute-dense-8192 | 36603.44 | 35520.32 | -2.96% |
| escapeAttribute-sparse-8192 | 8016.68 | 7431.47 | -7.30% |
| escapeAttribute-unicode-8192 | 21608.68 | 21310.15 | -1.38% |
| escapeAttribute-mixed-sizes | 11832.38 | 11762.89 | -0.59% |

## linux-arm64-musl: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 12918.98 | 12937.81 | 0.15% |
| escapeText-dense-256 | 1333.26 | 1090.22 | -18.23% |
| escapeText-dense-8192 | 57019.00 | 22933.61 | -59.78% |
| escapeText-sparse-8192 | 21467.66 | 8869.07 | -58.69% |
| escapeText-unicode-8192 | 34802.73 | 19121.01 | -45.06% |
| escapeText-mixed-sizes | 24851.02 | 15579.38 | -37.31% |
| escapeAttribute-unchanged | 12952.73 | 12997.28 | 0.34% |
| escapeAttribute-dense-256 | 2354.42 | 2018.64 | -14.26% |
| escapeAttribute-dense-8192 | 119887.97 | 49964.37 | -58.32% |
| escapeAttribute-sparse-8192 | 25647.19 | 12409.14 | -51.62% |
| escapeAttribute-unicode-8192 | 35778.94 | 19584.62 | -45.26% |
| escapeAttribute-mixed-sizes | 24614.31 | 15616.83 | -36.55% |

## linux-x64-musl: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 12711.35 | 12713.23 | 0.01% |
| escapeText-dense-256 | 1119.99 | 866.08 | -22.67% |
| escapeText-dense-8192 | 66518.19 | 19193.61 | -71.15% |
| escapeText-sparse-8192 | 23910.62 | 6297.50 | -73.66% |
| escapeText-unicode-8192 | 41358.15 | 19489.11 | -52.88% |
| escapeText-mixed-sizes | 26828.80 | 14052.41 | -47.62% |
| escapeAttribute-unchanged | 12721.35 | 12760.64 | 0.31% |
| escapeAttribute-dense-256 | 1815.46 | 1471.51 | -18.95% |
| escapeAttribute-dense-8192 | 137555.83 | 37520.35 | -72.72% |
| escapeAttribute-sparse-8192 | 26498.68 | 8642.38 | -67.39% |
| escapeAttribute-unicode-8192 | 41938.00 | 19720.61 | -52.98% |
| escapeAttribute-mixed-sizes | 26271.22 | 14098.26 | -46.34% |

## win32-arm64-msvc: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 13442.68 | 13475.51 | 0.24% |
| escapeText-dense-256 | 1288.21 | 1094.85 | -15.01% |
| escapeText-dense-8192 | 22141.60 | 21344.88 | -3.60% |
| escapeText-sparse-8192 | 8421.15 | 7804.94 | -7.32% |
| escapeText-unicode-8192 | 18648.84 | 18206.39 | -2.37% |
| escapeText-mixed-sizes | 12975.41 | 10590.18 | -18.38% |
| escapeAttribute-unchanged | 13514.11 | 13487.19 | -0.20% |
| escapeAttribute-dense-256 | 2227.58 | 1934.40 | -13.16% |
| escapeAttribute-dense-8192 | 48079.72 | 47042.58 | -2.16% |
| escapeAttribute-sparse-8192 | 12048.53 | 11489.52 | -4.64% |
| escapeAttribute-unicode-8192 | 19532.79 | 18963.45 | -2.91% |
| escapeAttribute-mixed-sizes | 10898.92 | 10905.25 | 0.06% |

## win32-x64-msvc: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 14974.12 | 15477.21 | 3.36% |
| escapeText-dense-256 | 1376.15 | 1118.61 | -18.71% |
| escapeText-dense-8192 | 23768.59 | 22578.26 | -5.01% |
| escapeText-sparse-8192 | 8457.31 | 7503.50 | -11.28% |
| escapeText-unicode-8192 | 20350.98 | 19795.10 | -2.73% |
| escapeText-mixed-sizes | 10829.71 | 10560.04 | -2.49% |
| escapeAttribute-unchanged | 15036.86 | 14913.11 | -0.82% |
| escapeAttribute-dense-256 | 2379.00 | 2100.57 | -11.70% |
| escapeAttribute-dense-8192 | 51915.63 | 51974.15 | 0.11% |
| escapeAttribute-sparse-8192 | 11500.13 | 10705.61 | -6.91% |
| escapeAttribute-unicode-8192 | 21936.68 | 21450.50 | -2.22% |
| escapeAttribute-mixed-sizes | 11315.11 | 11056.99 | -2.28% |

## local: reuse

| Case | Before (ns) | After (ns) | Change |
| --- | ---: | ---: | ---: |
| escapeText-unchanged | 13483.20 | 13948.19 | 3.45% |
| escapeText-dense-256 | 793.74 | 663.81 | -16.37% |
| escapeText-dense-8192 | 14094.05 | 13766.12 | -2.33% |
| escapeText-sparse-8192 | 5581.04 | 5382.71 | -3.55% |
| escapeText-unicode-8192 | 18431.07 | 18657.44 | 1.23% |
| escapeText-mixed-sizes | 9832.54 | 10172.38 | 3.46% |
| escapeAttribute-unchanged | 13461.52 | 13581.43 | 0.89% |
| escapeAttribute-dense-256 | 1439.24 | 1177.52 | -18.18% |
| escapeAttribute-dense-8192 | 28003.80 | 27815.94 | -0.67% |
| escapeAttribute-sparse-8192 | 6738.36 | 6362.49 | -5.58% |
| escapeAttribute-unicode-8192 | 18669.29 | 18893.88 | 1.20% |
| escapeAttribute-mixed-sizes | 9743.64 | 10182.02 | 4.50% |
