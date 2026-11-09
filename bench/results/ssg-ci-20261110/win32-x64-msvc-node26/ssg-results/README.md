# Full Astro static-build comparison

win32 x64; AMD EPYC 9V74 80-Core Processor                ; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T13:59:22.518Z. Completed: 2026-11-10T14:04:02.380Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.763 | 1.723–1.783 | 301.2 | 321.1 | 1.451 |
| articles | 0 | wasm | 1.771 | 1.725–1.777 | 300.9 | 321.6 | 0.708 |
| articles | 0 | escape-html | 1.750 | 1.732–1.772 | 301.8 | 320.7 | 0.519 |
| articles | 0 | fast-escape-html | 1.769 | 1.740–1.770 | 302.1 | 320.3 | 0.575 |
| articles | 0 | html-escaper | 1.760 | 1.725–1.773 | 301.4 | 319.0 | 0.552 |
| articles | 2 | native | 1.891 | 1.883–1.926 | 430.6 | 433.7 | 2.684 |
| articles | 2 | wasm | 1.908 | 1.897–1.943 | 429.7 | 431.6 | 4.297 |
| articles | 2 | escape-html | 1.904 | 1.894–1.931 | 426.6 | 430.6 | 1.138 |
| articles | 2 | fast-escape-html | 1.888 | 1.871–1.924 | 429.6 | 430.2 | 0.879 |
| articles | 2 | html-escaper | 1.893 | 1.878–1.907 | 428.5 | 429.9 | 0.777 |
| catalog | 0 | native | 1.436 | 1.416–1.459 | 290.8 | 302.2 | 1.444 |
| catalog | 0 | wasm | 1.454 | 1.449–1.474 | 291.0 | 302.1 | 0.714 |
| catalog | 0 | escape-html | 1.442 | 1.417–1.446 | 290.8 | 300.7 | 0.514 |
| catalog | 0 | fast-escape-html | 1.414 | 1.414–1.438 | 300.1 | 301.1 | 0.578 |
| catalog | 0 | html-escaper | 1.439 | 1.409–1.453 | 291.0 | 302.8 | 0.548 |
| catalog | 2 | native | 1.585 | 1.568–1.601 | 387.3 | 387.5 | 2.679 |
| catalog | 2 | wasm | 1.605 | 1.589–1.645 | 371.2 | 389.4 | 2.562 |
| catalog | 2 | escape-html | 1.588 | 1.568–1.610 | 389.3 | 389.4 | 0.899 |
| catalog | 2 | fast-escape-html | 1.610 | 1.584–1.615 | 370.7 | 372.4 | 1.123 |
| catalog | 2 | html-escaper | 1.597 | 1.578–1.614 | 367.1 | 385.0 | 0.814 |
| props | 0 | native | 1.586 | 1.569–1.624 | 368.7 | 370.4 | 1.450 |
| props | 0 | wasm | 1.646 | 1.633–1.656 | 366.7 | 369.4 | 0.729 |
| props | 0 | escape-html | 1.587 | 1.582–1.637 | 340.8 | 341.4 | 0.530 |
| props | 0 | fast-escape-html | 1.590 | 1.581–1.600 | 335.8 | 341.9 | 0.584 |
| props | 0 | html-escaper | 1.617 | 1.610–1.631 | 360.6 | 370.8 | 0.538 |
| props | 2 | native | 1.753 | 1.717–1.772 | 466.2 | 477.6 | 2.521 |
| props | 2 | wasm | 1.775 | 1.763–1.853 | 474.3 | 493.4 | 4.403 |
| props | 2 | escape-html | 1.754 | 1.741–1.791 | 477.7 | 489.2 | 1.006 |
| props | 2 | fast-escape-html | 1.763 | 1.727–1.775 | 474.4 | 493.4 | 0.840 |
| props | 2 | html-escaper | 1.771 | 1.760–1.816 | 478.8 | 483.3 | 1.074 |

## Actual escape inputs

| Scenario | Pages | Calls | Unchanged % | UTF-16 units | Target units % | Maximum length | Output MiB |
|---|---:|---:|---:|---:|---:|---:|---:|
| articles | 1000 | 6000 | 66.67 | 89462 | 11.18 | 30 | 10.14 |
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
