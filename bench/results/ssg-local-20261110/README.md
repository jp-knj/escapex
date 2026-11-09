# Full Astro static-build comparison

darwin arm64; Apple M2; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T09:44:24.090Z. Completed: 2026-11-10T09:46:45.420Z. Source commit: 2de7af9664e32f487014361640ba4e1c73c9b715.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 0.840 | 0.835–0.844 | 432.3 | 434.0 | 1.084 |
| articles | 0 | wasm | 0.839 | 0.834–0.859 | 432.3 | 434.6 | 0.318 |
| articles | 0 | escape-html | 0.838 | 0.835–0.856 | 433.8 | 434.4 | 0.191 |
| articles | 0 | fast-escape-html | 0.837 | 0.830–0.860 | 432.0 | 434.0 | 0.233 |
| articles | 0 | html-escaper | 0.838 | 0.832–0.888 | 431.8 | 432.4 | 0.221 |
| articles | 2 | native | 0.877 | 0.874–0.889 | 538.0 | 542.7 | 1.701 |
| articles | 2 | wasm | 0.876 | 0.870–0.885 | 537.2 | 537.9 | 0.429 |
| articles | 2 | escape-html | 0.879 | 0.874–0.888 | 539.3 | 542.6 | 0.312 |
| articles | 2 | fast-escape-html | 0.876 | 0.872–0.881 | 539.9 | 540.9 | 0.351 |
| articles | 2 | html-escaper | 0.876 | 0.871–0.878 | 539.7 | 541.8 | 0.347 |
| catalog | 0 | native | 0.700 | 0.693–0.706 | 401.8 | 402.4 | 1.102 |
| catalog | 0 | wasm | 0.706 | 0.699–0.710 | 401.7 | 403.6 | 0.317 |
| catalog | 0 | escape-html | 0.701 | 0.698–0.760 | 402.7 | 404.1 | 0.189 |
| catalog | 0 | fast-escape-html | 0.705 | 0.693–0.715 | 402.0 | 404.1 | 0.234 |
| catalog | 0 | html-escaper | 0.697 | 0.694–0.701 | 401.7 | 406.1 | 0.225 |
| catalog | 2 | native | 0.746 | 0.740–0.747 | 492.6 | 495.4 | 1.696 |
| catalog | 2 | wasm | 0.746 | 0.745–0.753 | 466.1 | 467.0 | 0.431 |
| catalog | 2 | escape-html | 0.738 | 0.738–0.747 | 466.4 | 468.3 | 0.309 |
| catalog | 2 | fast-escape-html | 0.740 | 0.737–0.741 | 465.8 | 468.5 | 0.360 |
| catalog | 2 | html-escaper | 0.739 | 0.737–0.744 | 469.5 | 481.7 | 0.360 |
| props | 0 | native | 0.829 | 0.826–0.910 | 479.9 | 487.4 | 1.087 |
| props | 0 | wasm | 0.881 | 0.873–0.962 | 485.4 | 489.6 | 0.315 |
| props | 0 | escape-html | 0.893 | 0.888–0.900 | 501.8 | 510.7 | 0.185 |
| props | 0 | fast-escape-html | 0.897 | 0.890–0.919 | 510.9 | 512.9 | 0.237 |
| props | 0 | html-escaper | 0.898 | 0.887–0.901 | 493.8 | 502.7 | 0.228 |
| props | 2 | native | 0.829 | 0.815–0.929 | 608.3 | 624.6 | 1.673 |
| props | 2 | wasm | 0.847 | 0.843–0.890 | 618.7 | 632.2 | 0.420 |
| props | 2 | escape-html | 0.849 | 0.844–0.863 | 569.9 | 574.5 | 0.309 |
| props | 2 | fast-escape-html | 0.849 | 0.843–0.857 | 567.6 | 585.0 | 0.359 |
| props | 2 | html-escaper | 0.852 | 0.851–0.861 | 592.8 | 607.6 | 0.352 |

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
