# Full Astro static-build comparison

linux arm64; unknown; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T13:59:22.502Z. Completed: 2026-11-10T14:05:19.093Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 2.284 | 2.232–2.314 | 511.8 | 518.8 | 3.201 |
| articles | 0 | wasm | 2.292 | 2.273–2.322 | 516.6 | 520.9 | 0.913 |
| articles | 0 | escape-html | 2.292 | 2.261–2.311 | 512.4 | 516.6 | 0.368 |
| articles | 0 | fast-escape-html | 2.294 | 2.242–2.313 | 512.7 | 524.4 | 0.522 |
| articles | 0 | html-escaper | 2.308 | 2.255–2.340 | 514.4 | 520.4 | 0.476 |
| articles | 2 | native | 2.610 | 2.541–2.651 | 637.2 | 645.3 | 4.608 |
| articles | 2 | wasm | 2.632 | 2.574–2.689 | 632.4 | 651.5 | 1.882 |
| articles | 2 | escape-html | 2.593 | 2.553–2.623 | 635.9 | 639.6 | 0.865 |
| articles | 2 | fast-escape-html | 2.621 | 2.560–2.656 | 632.1 | 636.1 | 1.013 |
| articles | 2 | html-escaper | 2.587 | 2.550–2.592 | 630.1 | 635.4 | 0.928 |
| catalog | 0 | native | 1.841 | 1.772–1.885 | 495.5 | 503.0 | 3.254 |
| catalog | 0 | wasm | 1.883 | 1.863–1.887 | 497.8 | 507.7 | 0.862 |
| catalog | 0 | escape-html | 1.867 | 1.832–1.896 | 493.8 | 503.5 | 0.398 |
| catalog | 0 | fast-escape-html | 1.846 | 1.815–1.889 | 493.9 | 498.0 | 0.522 |
| catalog | 0 | html-escaper | 1.874 | 1.853–1.907 | 494.2 | 508.2 | 0.470 |
| catalog | 2 | native | 2.139 | 2.123–2.154 | 571.0 | 592.1 | 4.403 |
| catalog | 2 | wasm | 2.082 | 2.066–2.163 | 569.4 | 575.9 | 1.955 |
| catalog | 2 | escape-html | 2.143 | 2.106–2.164 | 583.7 | 586.5 | 0.805 |
| catalog | 2 | fast-escape-html | 2.088 | 2.064–2.123 | 572.6 | 585.5 | 1.089 |
| catalog | 2 | html-escaper | 2.114 | 2.094–2.136 | 571.5 | 578.3 | 0.955 |
| props | 0 | native | 2.054 | 1.999–2.066 | 583.2 | 593.7 | 3.208 |
| props | 0 | wasm | 2.084 | 2.055–2.147 | 581.3 | 583.9 | 0.899 |
| props | 0 | escape-html | 2.013 | 1.977–2.083 | 541.6 | 551.6 | 0.412 |
| props | 0 | fast-escape-html | 2.020 | 2.005–2.062 | 545.1 | 565.4 | 0.476 |
| props | 0 | html-escaper | 2.050 | 2.018–2.123 | 572.0 | 574.6 | 0.454 |
| props | 2 | native | 2.245 | 2.235–2.280 | 688.4 | 697.4 | 4.397 |
| props | 2 | wasm | 2.264 | 2.235–2.273 | 701.5 | 707.1 | 1.608 |
| props | 2 | escape-html | 2.262 | 2.244–2.311 | 685.7 | 711.3 | 0.890 |
| props | 2 | fast-escape-html | 2.301 | 2.272–2.305 | 687.5 | 705.3 | 0.965 |
| props | 2 | html-escaper | 2.285 | 2.252–2.308 | 693.0 | 716.7 | 0.951 |

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
