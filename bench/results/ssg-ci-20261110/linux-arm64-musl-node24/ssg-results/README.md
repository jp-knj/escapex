# Full Astro static-build comparison

linux arm64; unknown; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T13:59:26.055Z. Completed: 2026-11-10T14:05:59.646Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 2.511 | 2.458–2.549 | 549.2 | 553.7 | 3.424 |
| articles | 0 | wasm | 2.502 | 2.464–2.525 | 540.7 | 566.8 | 0.938 |
| articles | 0 | escape-html | 2.461 | 2.444–2.584 | 538.9 | 550.8 | 0.434 |
| articles | 0 | fast-escape-html | 2.525 | 2.448–2.553 | 544.9 | 550.8 | 0.605 |
| articles | 0 | html-escaper | 2.490 | 2.440–2.498 | 546.6 | 556.4 | 0.572 |
| articles | 2 | native | 2.886 | 2.813–2.889 | 639.2 | 654.8 | 4.766 |
| articles | 2 | wasm | 2.883 | 2.862–2.900 | 647.4 | 649.2 | 1.986 |
| articles | 2 | escape-html | 2.877 | 2.845–2.922 | 645.4 | 655.4 | 0.865 |
| articles | 2 | fast-escape-html | 2.891 | 2.840–2.947 | 637.8 | 646.1 | 1.129 |
| articles | 2 | html-escaper | 2.858 | 2.803–2.888 | 647.8 | 656.5 | 0.933 |
| catalog | 0 | native | 1.991 | 1.924–2.015 | 537.8 | 541.2 | 3.446 |
| catalog | 0 | wasm | 2.025 | 1.968–2.043 | 537.4 | 548.0 | 1.008 |
| catalog | 0 | escape-html | 1.992 | 1.968–2.023 | 539.7 | 542.7 | 0.434 |
| catalog | 0 | fast-escape-html | 2.001 | 1.964–2.042 | 539.9 | 548.3 | 0.590 |
| catalog | 0 | html-escaper | 2.002 | 1.955–2.043 | 537.4 | 545.9 | 0.532 |
| catalog | 2 | native | 2.280 | 2.233–2.351 | 568.9 | 578.5 | 4.773 |
| catalog | 2 | wasm | 2.281 | 2.253–2.301 | 576.4 | 581.4 | 1.722 |
| catalog | 2 | escape-html | 2.277 | 2.252–2.345 | 573.6 | 574.7 | 0.955 |
| catalog | 2 | fast-escape-html | 2.266 | 2.224–2.344 | 572.5 | 578.5 | 1.131 |
| catalog | 2 | html-escaper | 2.320 | 2.301–2.339 | 577.0 | 585.4 | 0.956 |
| props | 0 | native | 2.219 | 2.190–2.262 | 586.6 | 596.3 | 3.592 |
| props | 0 | wasm | 2.299 | 2.289–2.377 | 586.6 | 588.6 | 0.930 |
| props | 0 | escape-html | 2.259 | 2.174–2.361 | 630.2 | 651.1 | 0.451 |
| props | 0 | fast-escape-html | 2.246 | 2.196–2.347 | 624.3 | 640.4 | 0.557 |
| props | 0 | html-escaper | 2.310 | 2.299–2.334 | 606.9 | 629.9 | 0.518 |
| props | 2 | native | 2.389 | 2.355–2.420 | 704.5 | 724.1 | 4.682 |
| props | 2 | wasm | 2.460 | 2.363–2.498 | 685.1 | 695.2 | 1.830 |
| props | 2 | escape-html | 2.405 | 2.357–2.459 | 674.8 | 686.9 | 0.775 |
| props | 2 | fast-escape-html | 2.383 | 2.343–2.475 | 676.8 | 678.5 | 1.193 |
| props | 2 | html-escaper | 2.433 | 2.417–2.485 | 685.2 | 699.8 | 0.977 |

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
