# Full Astro static-build comparison

linux x64; Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T13:59:05.185Z. Completed: 2026-11-10T14:04:05.743Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.886 | 1.855–1.994 | 536.3 | 543.6 | 3.549 |
| articles | 0 | wasm | 1.892 | 1.843–2.053 | 537.1 | 543.0 | 0.677 |
| articles | 0 | escape-html | 1.871 | 1.864–1.880 | 541.1 | 543.5 | 0.265 |
| articles | 0 | fast-escape-html | 1.885 | 1.857–1.912 | 540.7 | 545.0 | 0.362 |
| articles | 0 | html-escaper | 1.883 | 1.858–1.889 | 537.1 | 544.9 | 0.308 |
| articles | 2 | native | 2.092 | 2.085–2.098 | 642.3 | 645.9 | 4.605 |
| articles | 2 | wasm | 2.098 | 2.078–2.103 | 637.5 | 640.6 | 1.181 |
| articles | 2 | escape-html | 2.088 | 2.057–2.111 | 646.9 | 653.3 | 0.539 |
| articles | 2 | fast-escape-html | 2.086 | 2.038–2.104 | 641.3 | 641.5 | 0.635 |
| articles | 2 | html-escaper | 2.103 | 2.097–2.129 | 642.1 | 646.1 | 0.592 |
| catalog | 0 | native | 1.505 | 1.498–1.509 | 511.4 | 516.4 | 3.525 |
| catalog | 0 | wasm | 1.521 | 1.506–1.537 | 513.6 | 527.2 | 0.671 |
| catalog | 0 | escape-html | 1.510 | 1.493–1.521 | 521.0 | 527.7 | 0.258 |
| catalog | 0 | fast-escape-html | 1.503 | 1.498–1.534 | 518.4 | 528.3 | 0.350 |
| catalog | 0 | html-escaper | 1.515 | 1.504–1.516 | 510.3 | 522.8 | 0.308 |
| catalog | 2 | native | 1.676 | 1.666–1.697 | 583.0 | 583.9 | 4.930 |
| catalog | 2 | wasm | 1.685 | 1.664–1.687 | 550.8 | 553.7 | 1.226 |
| catalog | 2 | escape-html | 1.668 | 1.654–1.679 | 562.0 | 584.1 | 0.548 |
| catalog | 2 | fast-escape-html | 1.669 | 1.654–1.671 | 563.9 | 581.7 | 0.622 |
| catalog | 2 | html-escaper | 1.668 | 1.661–1.688 | 565.2 | 574.0 | 0.655 |
| props | 0 | native | 1.753 | 1.744–1.766 | 558.3 | 573.2 | 3.561 |
| props | 0 | wasm | 1.814 | 1.788–1.828 | 556.5 | 562.3 | 0.689 |
| props | 0 | escape-html | 1.822 | 1.800–1.837 | 602.1 | 604.8 | 0.268 |
| props | 0 | fast-escape-html | 1.811 | 1.796–1.821 | 596.9 | 599.2 | 0.356 |
| props | 0 | html-escaper | 1.855 | 1.836–1.869 | 573.6 | 577.1 | 0.314 |
| props | 2 | native | 1.792 | 1.764–1.798 | 702.0 | 714.7 | 4.389 |
| props | 2 | wasm | 1.869 | 1.814–1.906 | 680.1 | 686.5 | 1.156 |
| props | 2 | escape-html | 1.817 | 1.811–1.904 | 667.7 | 677.4 | 0.577 |
| props | 2 | fast-escape-html | 1.843 | 1.837–1.882 | 658.6 | 675.3 | 0.647 |
| props | 2 | html-escaper | 1.863 | 1.808–1.868 | 678.4 | 680.2 | 0.575 |

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
