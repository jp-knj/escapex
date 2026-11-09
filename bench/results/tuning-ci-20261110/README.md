# Packed native entity copies

Candidate `cf51cdce642d3a45d044d0e5eb61f89dab48319e`, predecessor `79c0f63ea166dceabebb79279cb3c560cb3c1fc0`.

[Workflow 42836932107](https://github.com/jp-knj/html-escape/actions/runs/42836932107): all 24 platform/Node combinations passed native API, npm-package, Worker, ESM/Wasm and Rust checks. NEON, SSE2 and AVX2 were executed on supported hardware.

The eight Node 24 environments each completed 75 full builds, 75 corpus-replay processes and 15 microbenchmark processes with 25 cases. All static output hashes match within each environment. Source, binary, artifact hashes and every sample were verified; no rounds were discarded.

## Long JSON API comparison

Change relative to the preceding native implementation. Negative means less time. The actual-props column replays all 384 calls from 64 SSG pages; the microbenchmark column is the existing quoted-JSON fixture.

| Target | Actual props corpus | Quoted JSON | Dense quotes |
|---|---:|---:|---:|
| darwin-arm64 | +2.92% | -22.94% | -28.55% |
| darwin-x64 | -10.20% | -25.44% | -54.56% |
| linux-arm64-gnu | -3.24% | -10.68% | -11.31% |
| linux-x64-gnu | -2.30% | -5.83% | -17.50% |
| linux-arm64-musl | -1.49% | -3.74% | -4.70% |
| linux-x64-musl | -3.30% | -4.55% | -4.10% |
| win32-arm64-msvc | -8.90% | -8.33% | -9.71% |
| win32-x64-msvc | -4.71% | -9.14% | -12.40% |

## Complete SSG vs the fastest competitor

For each cell, select the lowest five-run median among escape-html, fast-escape-html and html-escaper on that runner. This is a separate baseline from the preceding native implementation.

| Target | Articles | Catalog | Large props |
|---|---:|---:|---:|
| darwin-arm64 | +17.32% (html-escaper) | +2.50% (escape-html) | +9.83% (html-escaper) |
| darwin-x64 | -11.77% (fast-escape-html) | +2.88% (fast-escape-html) | -0.18% (html-escaper) |
| linux-arm64-gnu | +1.71% (fast-escape-html) | +0.06% (fast-escape-html) | -2.73% (escape-html) |
| linux-x64-gnu | +0.39% (escape-html) | -0.18% (html-escaper) | -2.88% (escape-html) |
| linux-arm64-musl | +0.68% (escape-html) | +0.32% (fast-escape-html) | +0.21% (escape-html) |
| linux-x64-musl | +0.68% (escape-html) | -0.12% (fast-escape-html) | -3.41% (escape-html) |
| win32-arm64-msvc | -0.28% (html-escaper) | +0.03% (html-escaper) | -4.71% (html-escaper) |
| win32-x64-msvc | +1.43% (html-escaper) | +0.32% (fast-escape-html) | -2.89% (escape-html) |

## Complete SSG before and after

| Target | Articles | Catalog | Large props |
|---|---:|---:|---:|
| darwin-arm64 | +10.22% | -10.40% | -6.48% |
| darwin-x64 | -12.51% | -3.12% | -6.10% |
| linux-arm64-gnu | -0.57% | -0.65% | -0.23% |
| linux-x64-gnu | -0.33% | -0.80% | +0.14% |
| linux-arm64-musl | -1.47% | -1.28% | +1.54% |
| linux-x64-musl | -0.04% | -0.37% | -2.43% |
| win32-arm64-msvc | -1.06% | +0.15% | +0.48% |
| win32-x64-msvc | +1.01% | +0.78% | -0.55% |

## Absolute complete-build medians

Milliseconds; five fresh processes per cell.

| Target | Site | Before native | Native | escape-html | fast-escape-html | html-escaper |
|---|---|---:|---:|---:|---:|---:|
| darwin-arm64 | articles | 1477.926 | 1628.967 | 1689.089 | 1536.421 | 1388.429 |
| darwin-arm64 | catalog | 1231.181 | 1103.127 | 1076.258 | 1159.114 | 1159.828 |
| darwin-arm64 | props | 1566.629 | 1465.081 | 1477.945 | 1392.990 | 1333.968 |
| darwin-x64 | articles | 5018.930 | 4391.143 | 5141.552 | 4976.763 | 5297.012 |
| darwin-x64 | catalog | 3219.213 | 3118.824 | 3258.698 | 3031.590 | 3112.622 |
| darwin-x64 | props | 3334.853 | 3131.475 | 3338.184 | 3431.855 | 3137.060 |
| linux-arm64-gnu | articles | 2090.383 | 2078.409 | 2057.388 | 2043.492 | 2081.013 |
| linux-arm64-gnu | catalog | 1621.163 | 1610.585 | 1610.500 | 1609.581 | 1620.659 |
| linux-arm64-gnu | props | 1771.673 | 1767.580 | 1817.116 | 1819.491 | 1874.051 |
| linux-x64-gnu | articles | 1623.597 | 1618.195 | 1611.886 | 1624.460 | 1620.360 |
| linux-x64-gnu | catalog | 1307.342 | 1296.922 | 1302.348 | 1300.093 | 1299.268 |
| linux-x64-gnu | props | 1515.114 | 1517.197 | 1562.212 | 1575.283 | 1621.475 |
| linux-arm64-musl | articles | 2554.188 | 2516.641 | 2499.523 | 2518.202 | 2524.305 |
| linux-arm64-musl | catalog | 2046.896 | 2020.696 | 2041.614 | 2014.292 | 2025.552 |
| linux-arm64-musl | props | 2202.176 | 2236.142 | 2231.560 | 2286.693 | 2292.878 |
| linux-x64-musl | articles | 1917.679 | 1916.897 | 1903.952 | 1931.524 | 1915.208 |
| linux-x64-musl | catalog | 1560.768 | 1554.922 | 1562.439 | 1556.758 | 1557.856 |
| linux-x64-musl | props | 1902.601 | 1856.324 | 1921.829 | 1945.233 | 1991.296 |
| win32-arm64-msvc | articles | 3915.694 | 3874.161 | 3899.109 | 3916.830 | 3884.848 |
| win32-arm64-msvc | catalog | 2709.363 | 2713.425 | 2732.141 | 2731.601 | 2712.570 |
| win32-arm64-msvc | props | 2817.381 | 2830.967 | 2995.778 | 2986.281 | 2971.025 |
| win32-x64-msvc | articles | 2690.931 | 2718.193 | 2695.687 | 2681.370 | 2679.838 |
| win32-x64-msvc | catalog | 2119.951 | 2136.447 | 2145.362 | 2129.555 | 2134.003 |
| win32-x64-msvc | props | 2489.651 | 2475.910 | 2549.591 | 2643.191 | 2580.795 |

The all-environment 5% full-build goal is **not met**. None of the eight large-props full-build medians is 5% below its fastest competitor. Quoted-JSON API medians improve on all eight targets, exceeding 5% on six; that does not establish the full-build goal.

Hosted macOS runs vary substantially, including short inputs that use identical JavaScript. The ARM64 actual-props replay median regressed 2.92% while its quoted-JSON microbenchmark improved 22.94%. Treat the medians as descriptive, not confidence intervals or proof that the copy change caused every observed difference. Musl allocation and string-conversion costs remain part of the API measurement.

See [the protocol](../../ssg/TUNING.md). Raw cost, SSG and micro results are under each `*-node24/ssg-tuning/results/` directory; all Node environments retain Rust logs and machine metadata. Peak RSS and initial API import time are recorded in SSG JSON. No cross-host absolute-speed ranking or general 5% speedup is claimed.
