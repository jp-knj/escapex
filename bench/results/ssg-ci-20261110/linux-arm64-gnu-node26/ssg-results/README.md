# Full Astro static-build comparison

linux arm64; unknown; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T13:59:07.202Z. Completed: 2026-11-10T14:04:07.304Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.862 | 1.861–1.895 | 519.3 | 528.7 | 4.015 |
| articles | 0 | wasm | 1.870 | 1.850–1.898 | 513.3 | 524.1 | 0.897 |
| articles | 0 | escape-html | 1.851 | 1.844–1.874 | 519.2 | 535.8 | 0.357 |
| articles | 0 | fast-escape-html | 1.847 | 1.842–1.866 | 518.3 | 523.1 | 0.483 |
| articles | 0 | html-escaper | 1.863 | 1.846–1.874 | 514.9 | 518.0 | 0.435 |
| articles | 2 | native | 2.259 | 2.217–2.349 | 636.9 | 647.7 | 5.472 |
| articles | 2 | wasm | 2.236 | 2.156–2.314 | 634.8 | 645.1 | 1.352 |
| articles | 2 | escape-html | 2.229 | 2.213–2.295 | 628.9 | 643.3 | 0.706 |
| articles | 2 | fast-escape-html | 2.259 | 2.244–2.293 | 631.8 | 647.7 | 0.772 |
| articles | 2 | html-escaper | 2.259 | 2.224–2.298 | 629.2 | 636.9 | 0.729 |
| catalog | 0 | native | 1.548 | 1.517–1.558 | 491.5 | 495.1 | 4.168 |
| catalog | 0 | wasm | 1.556 | 1.554–1.579 | 493.3 | 500.2 | 0.951 |
| catalog | 0 | escape-html | 1.549 | 1.510–1.570 | 489.3 | 510.9 | 0.390 |
| catalog | 0 | fast-escape-html | 1.556 | 1.544–1.586 | 496.6 | 510.0 | 0.514 |
| catalog | 0 | html-escaper | 1.544 | 1.519–1.558 | 483.9 | 500.8 | 0.426 |
| catalog | 2 | native | 1.808 | 1.776–1.844 | 569.2 | 577.3 | 6.052 |
| catalog | 2 | wasm | 1.793 | 1.778–1.811 | 556.0 | 570.1 | 1.444 |
| catalog | 2 | escape-html | 1.806 | 1.744–1.843 | 563.9 | 572.9 | 0.697 |
| catalog | 2 | fast-escape-html | 1.785 | 1.719–1.838 | 563.8 | 571.6 | 0.819 |
| catalog | 2 | html-escaper | 1.817 | 1.749–1.862 | 561.0 | 570.3 | 0.746 |
| props | 0 | native | 1.661 | 1.635–1.674 | 570.1 | 585.6 | 4.227 |
| props | 0 | wasm | 1.721 | 1.710–1.768 | 578.4 | 596.9 | 0.978 |
| props | 0 | escape-html | 1.674 | 1.654–1.677 | 540.7 | 542.6 | 0.410 |
| props | 0 | fast-escape-html | 1.667 | 1.647–1.741 | 532.6 | 545.7 | 0.529 |
| props | 0 | html-escaper | 1.713 | 1.700–1.717 | 559.9 | 563.8 | 0.450 |
| props | 2 | native | 1.834 | 1.792–1.840 | 712.5 | 727.8 | 5.737 |
| props | 2 | wasm | 1.861 | 1.836–1.871 | 702.2 | 717.9 | 2.137 |
| props | 2 | escape-html | 1.822 | 1.812–1.850 | 685.1 | 717.7 | 0.700 |
| props | 2 | fast-escape-html | 1.815 | 1.774–1.857 | 701.4 | 734.9 | 0.837 |
| props | 2 | html-escaper | 1.847 | 1.799–1.888 | 712.2 | 723.0 | 0.773 |

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
