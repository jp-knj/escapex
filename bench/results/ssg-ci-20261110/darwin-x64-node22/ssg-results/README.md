# Full Astro static-build comparison

darwin x64; Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T14:10:59.438Z. Completed: 2026-11-10T14:20:53.008Z. Source commit: b736e163074629eabcb69bdaff65c9b089f3ebb7.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 5.082 | 3.736–5.634 | 265.0 | 266.0 | 4.336 |
| articles | 0 | wasm | 5.232 | 4.680–6.252 | 266.1 | 269.1 | 2.777 |
| articles | 0 | escape-html | 4.751 | 4.360–5.570 | 264.6 | 266.1 | 0.540 |
| articles | 0 | fast-escape-html | 4.307 | 3.992–4.639 | 267.2 | 268.7 | 0.710 |
| articles | 0 | html-escaper | 4.768 | 3.812–5.470 | 268.1 | 269.7 | 0.703 |
| articles | 2 | native | 3.892 | 3.159–4.627 | 361.7 | 363.7 | 4.673 |
| articles | 2 | wasm | 4.898 | 3.132–5.387 | 364.8 | 365.9 | 7.030 |
| articles | 2 | escape-html | 3.932 | 3.640–5.513 | 364.1 | 366.6 | 1.064 |
| articles | 2 | fast-escape-html | 4.388 | 4.036–5.828 | 362.8 | 367.6 | 1.371 |
| articles | 2 | html-escaper | 5.213 | 3.042–5.802 | 366.0 | 368.7 | 1.245 |
| catalog | 0 | native | 2.532 | 2.021–2.844 | 253.1 | 256.0 | 2.760 |
| catalog | 0 | wasm | 2.449 | 2.075–2.556 | 255.1 | 257.0 | 1.984 |
| catalog | 0 | escape-html | 2.429 | 2.263–2.823 | 251.7 | 254.3 | 0.509 |
| catalog | 0 | fast-escape-html | 2.200 | 1.980–2.809 | 253.3 | 254.5 | 0.655 |
| catalog | 0 | html-escaper | 2.607 | 1.909–2.903 | 253.7 | 255.7 | 0.671 |
| catalog | 2 | native | 2.863 | 2.251–3.249 | 332.1 | 333.1 | 4.994 |
| catalog | 2 | wasm | 2.795 | 2.464–4.334 | 329.4 | 330.9 | 5.927 |
| catalog | 2 | escape-html | 2.794 | 2.384–3.288 | 324.7 | 327.7 | 0.854 |
| catalog | 2 | fast-escape-html | 2.490 | 2.211–3.180 | 327.1 | 327.9 | 0.967 |
| catalog | 2 | html-escaper | 2.474 | 2.378–3.264 | 327.8 | 329.4 | 0.931 |
| props | 0 | native | 2.294 | 2.182–2.949 | 295.0 | 298.4 | 2.719 |
| props | 0 | wasm | 2.351 | 2.271–3.101 | 297.4 | 298.7 | 2.050 |
| props | 0 | escape-html | 2.381 | 2.193–3.319 | 278.0 | 278.9 | 0.481 |
| props | 0 | fast-escape-html | 2.362 | 2.190–2.931 | 275.9 | 281.8 | 0.658 |
| props | 0 | html-escaper | 3.166 | 2.350–3.390 | 298.7 | 302.0 | 0.657 |
| props | 2 | native | 2.363 | 2.222–3.873 | 437.2 | 442.7 | 4.592 |
| props | 2 | wasm | 2.672 | 2.295–3.239 | 415.5 | 426.5 | 7.039 |
| props | 2 | escape-html | 2.456 | 2.313–3.855 | 434.7 | 437.0 | 0.832 |
| props | 2 | fast-escape-html | 2.794 | 2.357–3.422 | 432.4 | 439.9 | 0.931 |
| props | 2 | html-escaper | 2.828 | 2.475–4.623 | 437.5 | 450.3 | 1.261 |

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
