# Full Astro static-build comparison

darwin arm64; Apple M1 (Virtual); Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T14:00:10.249Z. Completed: 2026-11-10T14:05:29.332Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.780 | 1.325–2.385 | 401.2 | 405.3 | 2.899 |
| articles | 0 | wasm | 1.975 | 1.500–5.551 | 399.4 | 404.7 | 1.479 |
| articles | 0 | escape-html | 1.920 | 1.692–2.983 | 398.5 | 400.7 | 0.993 |
| articles | 0 | fast-escape-html | 1.776 | 1.554–2.282 | 397.5 | 406.0 | 1.113 |
| articles | 0 | html-escaper | 1.993 | 1.400–2.318 | 399.1 | 402.9 | 1.278 |
| articles | 2 | native | 2.031 | 1.947–2.487 | 488.4 | 494.7 | 2.615 |
| articles | 2 | wasm | 2.080 | 1.745–2.551 | 490.3 | 492.3 | 0.878 |
| articles | 2 | escape-html | 2.179 | 1.675–2.351 | 492.5 | 495.3 | 0.442 |
| articles | 2 | fast-escape-html | 2.143 | 1.962–2.557 | 492.8 | 494.1 | 0.568 |
| articles | 2 | html-escaper | 2.182 | 1.735–2.648 | 491.1 | 498.8 | 0.525 |
| catalog | 0 | native | 1.541 | 1.250–1.958 | 382.9 | 386.5 | 1.545 |
| catalog | 0 | wasm | 1.533 | 1.332–2.023 | 383.0 | 386.2 | 0.692 |
| catalog | 0 | escape-html | 1.433 | 1.192–1.524 | 381.2 | 389.0 | 0.277 |
| catalog | 0 | fast-escape-html | 1.429 | 1.340–1.821 | 379.2 | 382.1 | 0.352 |
| catalog | 0 | html-escaper | 1.411 | 1.275–1.726 | 379.3 | 382.2 | 0.356 |
| catalog | 2 | native | 1.607 | 1.418–2.024 | 465.5 | 471.0 | 2.278 |
| catalog | 2 | wasm | 1.646 | 1.544–1.810 | 438.5 | 439.3 | 1.058 |
| catalog | 2 | escape-html | 1.640 | 1.425–1.837 | 438.2 | 438.9 | 0.495 |
| catalog | 2 | fast-escape-html | 1.490 | 1.432–1.593 | 450.2 | 470.8 | 0.486 |
| catalog | 2 | html-escaper | 1.612 | 1.423–1.884 | 439.8 | 444.7 | 0.500 |
| props | 0 | native | 1.973 | 1.888–2.180 | 451.6 | 454.0 | 1.727 |
| props | 0 | wasm | 2.028 | 1.703–2.523 | 463.5 | 465.9 | 0.827 |
| props | 0 | escape-html | 2.185 | 2.076–2.192 | 473.7 | 485.6 | 0.333 |
| props | 0 | fast-escape-html | 1.981 | 1.844–2.025 | 467.6 | 473.0 | 0.388 |
| props | 0 | html-escaper | 1.946 | 1.739–2.096 | 472.6 | 483.5 | 0.358 |
| props | 2 | native | 1.789 | 1.748–2.183 | 574.1 | 596.6 | 2.367 |
| props | 2 | wasm | 1.705 | 1.674–1.899 | 565.7 | 577.3 | 0.905 |
| props | 2 | escape-html | 1.753 | 1.516–2.321 | 543.5 | 550.0 | 0.406 |
| props | 2 | fast-escape-html | 2.018 | 1.744–2.270 | 542.6 | 552.0 | 0.605 |
| props | 2 | html-escaper | 1.920 | 1.776–2.284 | 557.8 | 562.5 | 0.501 |

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
