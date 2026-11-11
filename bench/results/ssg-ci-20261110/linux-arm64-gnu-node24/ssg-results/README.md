# Full Astro static-build comparison

linux arm64; unknown; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T13:59:00.382Z. Completed: 2026-11-10T14:04:06.054Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.997 | 1.979–2.008 | 547.7 | 555.6 | 4.003 |
| articles | 0 | wasm | 1.987 | 1.956–2.022 | 549.8 | 564.0 | 0.820 |
| articles | 0 | escape-html | 1.984 | 1.960–2.021 | 557.9 | 562.6 | 0.355 |
| articles | 0 | fast-escape-html | 1.989 | 1.971–2.019 | 547.6 | 565.4 | 0.468 |
| articles | 0 | html-escaper | 2.003 | 1.995–2.040 | 556.6 | 565.1 | 0.440 |
| articles | 2 | native | 2.193 | 2.170–2.217 | 645.5 | 653.0 | 4.764 |
| articles | 2 | wasm | 2.188 | 2.172–2.211 | 653.8 | 657.5 | 1.202 |
| articles | 2 | escape-html | 2.200 | 2.171–2.227 | 654.6 | 660.9 | 0.640 |
| articles | 2 | fast-escape-html | 2.179 | 2.167–2.234 | 656.1 | 663.3 | 0.725 |
| articles | 2 | html-escaper | 2.195 | 2.184–2.199 | 657.4 | 664.9 | 0.668 |
| catalog | 0 | native | 1.548 | 1.522–1.567 | 529.5 | 541.3 | 3.964 |
| catalog | 0 | wasm | 1.568 | 1.549–1.608 | 531.6 | 539.7 | 0.847 |
| catalog | 0 | escape-html | 1.564 | 1.515–1.575 | 538.1 | 548.2 | 0.341 |
| catalog | 0 | fast-escape-html | 1.568 | 1.544–1.601 | 538.4 | 547.3 | 0.487 |
| catalog | 0 | html-escaper | 1.563 | 1.549–1.576 | 530.3 | 540.4 | 0.405 |
| catalog | 2 | native | 1.698 | 1.684–1.743 | 601.4 | 629.2 | 5.142 |
| catalog | 2 | wasm | 1.685 | 1.680–1.691 | 562.0 | 575.6 | 1.738 |
| catalog | 2 | escape-html | 1.693 | 1.680–1.696 | 578.1 | 586.9 | 0.623 |
| catalog | 2 | fast-escape-html | 1.701 | 1.680–1.709 | 585.9 | 588.9 | 0.728 |
| catalog | 2 | html-escaper | 1.682 | 1.666–1.709 | 572.2 | 586.4 | 0.664 |
| props | 0 | native | 1.726 | 1.703–1.744 | 586.2 | 591.1 | 3.958 |
| props | 0 | wasm | 1.805 | 1.800–1.813 | 565.5 | 576.5 | 0.836 |
| props | 0 | escape-html | 1.774 | 1.757–1.801 | 620.8 | 629.8 | 0.378 |
| props | 0 | fast-escape-html | 1.779 | 1.770–1.795 | 615.2 | 627.6 | 0.476 |
| props | 0 | html-escaper | 1.820 | 1.794–1.830 | 591.5 | 612.8 | 0.427 |
| props | 2 | native | 1.802 | 1.754–1.825 | 716.3 | 726.8 | 4.926 |
| props | 2 | wasm | 1.809 | 1.776–1.825 | 724.1 | 735.1 | 1.235 |
| props | 2 | escape-html | 1.796 | 1.765–1.816 | 667.1 | 695.7 | 0.656 |
| props | 2 | fast-escape-html | 1.795 | 1.782–1.806 | 678.9 | 699.4 | 0.759 |
| props | 2 | html-escaper | 1.838 | 1.829–1.857 | 682.2 | 689.2 | 0.688 |

## Actual escape inputs

| Scenario | Pages | Calls | Unchanged % | UTF-16 units | Target units % | Maximum length | Output MiB |
|---|---:|---:|---:|---:|---:|---:|---:|
| articles | 1000 | 6000 | 66.67 | 89462 | 11.18 | 30 | 10.11 |
| catalog | 250 | 33250 | 2.26 | 1215030 | 9.42 | 49 | 6.60 |
| props | 64 | 384 | 50.00 | 10387462 | 13.89 | 162559 | 33.00 |

| Scenario | Input length (UTF-16 units) | Calls | Unchanged calls | Total units | Targets |
|---|---|---:|---:|---:|---:|
| articles | 0-16 | 4000 | 4000 | 29682 | 0 |
| articles | 17-64 | 2000 | 0 | 59780 | 10000 |
| articles | 65-256 | 0 | 0 | 0 | 0 |
| articles | 257-4096 | 0 | 0 | 0 | 0 |
| articles | 4097-65536 | 0 | 0 | 0 | 0 |
| articles | 65537+ | 0 | 0 | 0 | 0 |
| catalog | 0-16 | 750 | 750 | 5250 | 0 |
| catalog | 17-64 | 32500 | 0 | 1209780 | 114500 |
| catalog | 65-256 | 0 | 0 | 0 | 0 |
| catalog | 257-4096 | 0 | 0 | 0 | 0 |
| catalog | 4097-65536 | 0 | 0 | 0 | 0 |
| catalog | 65537+ | 0 | 0 | 0 | 0 |
| props | 0-16 | 192 | 192 | 1344 | 0 |
| props | 17-64 | 128 | 0 | 3692 | 640 |
| props | 65-256 | 0 | 0 | 0 | 0 |
| props | 257-4096 | 0 | 0 | 0 | 0 |
| props | 4097-65536 | 0 | 0 | 0 | 0 |
| props | 65537+ | 64 | 0 | 10382426 | 1441792 |

Raw samples, source hashes, output hashes, per-thread import measurements, and diagnostic profiles: [results.json](./results.json).
