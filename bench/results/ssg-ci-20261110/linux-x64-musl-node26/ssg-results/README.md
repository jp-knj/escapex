# Full Astro static-build comparison

linux x64; AMD EPYC 9V74 80-Core Processor; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T13:59:20.297Z. Completed: 2026-11-10T14:04:06.638Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.763 | 1.749–1.802 | 485.8 | 488.4 | 2.621 |
| articles | 0 | wasm | 1.751 | 1.733–1.770 | 487.4 | 496.3 | 0.635 |
| articles | 0 | escape-html | 1.738 | 1.725–1.809 | 489.6 | 493.8 | 0.263 |
| articles | 0 | fast-escape-html | 1.737 | 1.725–1.740 | 485.4 | 489.8 | 0.342 |
| articles | 0 | html-escaper | 1.755 | 1.728–1.766 | 487.2 | 491.8 | 0.313 |
| articles | 2 | native | 1.999 | 1.965–2.035 | 608.3 | 615.7 | 3.277 |
| articles | 2 | wasm | 2.001 | 1.997–2.023 | 611.6 | 616.7 | 1.726 |
| articles | 2 | escape-html | 1.999 | 1.988–2.041 | 611.1 | 619.4 | 0.549 |
| articles | 2 | fast-escape-html | 2.006 | 1.995–2.025 | 607.5 | 614.9 | 0.872 |
| articles | 2 | html-escaper | 2.003 | 1.973–2.028 | 610.9 | 613.7 | 0.736 |
| catalog | 0 | native | 1.460 | 1.443–1.469 | 469.6 | 470.2 | 2.611 |
| catalog | 0 | wasm | 1.483 | 1.474–1.514 | 470.4 | 475.4 | 0.601 |
| catalog | 0 | escape-html | 1.474 | 1.432–1.488 | 473.4 | 478.1 | 0.270 |
| catalog | 0 | fast-escape-html | 1.461 | 1.443–1.488 | 471.1 | 475.2 | 0.368 |
| catalog | 0 | html-escaper | 1.472 | 1.450–1.506 | 471.1 | 476.9 | 0.319 |
| catalog | 2 | native | 1.669 | 1.629–1.702 | 554.4 | 560.5 | 3.815 |
| catalog | 2 | wasm | 1.662 | 1.654–1.703 | 553.3 | 572.2 | 1.807 |
| catalog | 2 | escape-html | 1.663 | 1.632–1.696 | 549.7 | 558.9 | 0.533 |
| catalog | 2 | fast-escape-html | 1.657 | 1.631–1.687 | 554.1 | 559.8 | 0.738 |
| catalog | 2 | html-escaper | 1.685 | 1.655–1.693 | 558.2 | 567.4 | 0.697 |
| props | 0 | native | 1.678 | 1.661–1.683 | 563.1 | 567.1 | 2.675 |
| props | 0 | wasm | 1.750 | 1.703–1.759 | 551.5 | 557.6 | 0.618 |
| props | 0 | escape-html | 1.679 | 1.630–1.683 | 512.2 | 514.8 | 0.276 |
| props | 0 | fast-escape-html | 1.697 | 1.655–1.736 | 519.4 | 530.5 | 0.343 |
| props | 0 | html-escaper | 1.707 | 1.668–1.743 | 542.8 | 549.4 | 0.319 |
| props | 2 | native | 1.871 | 1.863–1.901 | 677.9 | 681.9 | 3.955 |
| props | 2 | wasm | 1.913 | 1.875–1.936 | 663.3 | 672.7 | 1.439 |
| props | 2 | escape-html | 1.882 | 1.854–1.944 | 658.6 | 667.6 | 0.579 |
| props | 2 | fast-escape-html | 1.888 | 1.866–1.908 | 665.3 | 675.5 | 0.688 |
| props | 2 | html-escaper | 1.896 | 1.885–2.009 | 674.3 | 687.2 | 0.691 |

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
