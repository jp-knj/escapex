# Full Astro static-build comparison

linux x64; AMD EPYC 9V45 96-Core Processor; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T13:59:06.780Z. Completed: 2026-11-10T14:03:00.400Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.445 | 1.426–1.555 | 529.2 | 533.3 | 2.236 |
| articles | 0 | wasm | 1.437 | 1.419–1.668 | 530.8 | 534.9 | 0.488 |
| articles | 0 | escape-html | 1.447 | 1.416–1.454 | 526.9 | 529.0 | 0.236 |
| articles | 0 | fast-escape-html | 1.459 | 1.417–1.508 | 529.3 | 539.2 | 0.302 |
| articles | 0 | html-escaper | 1.491 | 1.426–1.595 | 527.2 | 536.6 | 0.255 |
| articles | 2 | native | 1.648 | 1.618–1.654 | 637.8 | 638.5 | 2.892 |
| articles | 2 | wasm | 1.647 | 1.618–1.688 | 625.1 | 628.3 | 1.032 |
| articles | 2 | escape-html | 1.626 | 1.620–1.634 | 631.0 | 633.0 | 0.549 |
| articles | 2 | fast-escape-html | 1.629 | 1.625–1.631 | 623.9 | 630.3 | 0.658 |
| articles | 2 | html-escaper | 1.627 | 1.593–1.661 | 627.4 | 633.3 | 0.456 |
| catalog | 0 | native | 1.146 | 1.133–1.155 | 513.3 | 517.4 | 2.245 |
| catalog | 0 | wasm | 1.165 | 1.153–1.170 | 520.1 | 526.6 | 0.478 |
| catalog | 0 | escape-html | 1.154 | 1.134–1.158 | 514.9 | 519.2 | 0.227 |
| catalog | 0 | fast-escape-html | 1.153 | 1.137–1.211 | 516.0 | 524.2 | 0.298 |
| catalog | 0 | html-escaper | 1.139 | 1.136–1.148 | 506.0 | 511.6 | 0.256 |
| catalog | 2 | native | 1.315 | 1.282–1.331 | 560.2 | 584.4 | 3.216 |
| catalog | 2 | wasm | 1.315 | 1.308–1.320 | 554.8 | 560.3 | 1.016 |
| catalog | 2 | escape-html | 1.288 | 1.282–1.292 | 553.8 | 559.2 | 0.463 |
| catalog | 2 | fast-escape-html | 1.296 | 1.277–1.302 | 554.5 | 578.3 | 0.639 |
| catalog | 2 | html-escaper | 1.291 | 1.283–1.313 | 556.0 | 563.6 | 0.596 |
| props | 0 | native | 1.390 | 1.376–1.412 | 555.6 | 564.0 | 2.181 |
| props | 0 | wasm | 1.403 | 1.393–1.430 | 555.0 | 560.3 | 0.490 |
| props | 0 | escape-html | 1.397 | 1.368–1.416 | 594.7 | 604.9 | 0.228 |
| props | 0 | fast-escape-html | 1.384 | 1.378–1.402 | 599.5 | 607.2 | 0.303 |
| props | 0 | html-escaper | 1.426 | 1.420–1.444 | 574.3 | 598.5 | 0.280 |
| props | 2 | native | 1.477 | 1.462–1.518 | 683.4 | 693.9 | 3.137 |
| props | 2 | wasm | 1.495 | 1.475–1.560 | 671.1 | 680.8 | 1.141 |
| props | 2 | escape-html | 1.466 | 1.449–1.506 | 647.9 | 651.9 | 0.548 |
| props | 2 | fast-escape-html | 1.476 | 1.446–1.485 | 648.0 | 656.7 | 0.524 |
| props | 2 | html-escaper | 1.501 | 1.489–1.536 | 658.0 | 664.7 | 0.527 |

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
