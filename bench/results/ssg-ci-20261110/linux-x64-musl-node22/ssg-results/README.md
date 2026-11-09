# Full Astro static-build comparison

linux x64; AMD EPYC 9V45 96-Core Processor; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T13:59:10.160Z. Completed: 2026-11-10T14:03:21.653Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.690 | 1.659–1.786 | 419.6 | 422.2 | 2.531 |
| articles | 0 | wasm | 1.727 | 1.676–1.744 | 417.8 | 421.2 | 0.708 |
| articles | 0 | escape-html | 1.701 | 1.610–1.737 | 421.0 | 425.4 | 0.306 |
| articles | 0 | fast-escape-html | 1.718 | 1.640–1.837 | 421.2 | 425.4 | 0.490 |
| articles | 0 | html-escaper | 1.710 | 1.667–1.800 | 417.6 | 423.7 | 0.346 |
| articles | 2 | native | 1.775 | 1.751–1.842 | 520.8 | 527.7 | 3.238 |
| articles | 2 | wasm | 1.783 | 1.747–1.816 | 522.8 | 523.6 | 7.590 |
| articles | 2 | escape-html | 1.766 | 1.744–1.814 | 515.6 | 523.2 | 0.527 |
| articles | 2 | fast-escape-html | 1.820 | 1.767–1.846 | 521.0 | 525.6 | 0.669 |
| articles | 2 | html-escaper | 1.795 | 1.747–1.833 | 517.7 | 525.9 | 0.558 |
| catalog | 0 | native | 1.247 | 1.231–1.305 | 412.3 | 424.4 | 2.547 |
| catalog | 0 | wasm | 1.256 | 1.251–1.296 | 410.4 | 416.6 | 0.726 |
| catalog | 0 | escape-html | 1.220 | 1.201–1.267 | 405.7 | 415.8 | 0.305 |
| catalog | 0 | fast-escape-html | 1.231 | 1.216–1.277 | 411.4 | 413.8 | 0.423 |
| catalog | 0 | html-escaper | 1.239 | 1.236–1.261 | 408.5 | 412.2 | 0.377 |
| catalog | 2 | native | 1.455 | 1.356–1.473 | 487.6 | 493.1 | 4.244 |
| catalog | 2 | wasm | 1.473 | 1.374–1.494 | 488.9 | 494.4 | 6.769 |
| catalog | 2 | escape-html | 1.440 | 1.355–1.477 | 485.1 | 497.7 | 0.622 |
| catalog | 2 | fast-escape-html | 1.476 | 1.409–1.524 | 484.9 | 485.8 | 0.725 |
| catalog | 2 | html-escaper | 1.469 | 1.429–1.488 | 486.9 | 496.2 | 0.681 |
| props | 0 | native | 1.364 | 1.349–1.414 | 443.2 | 448.2 | 2.435 |
| props | 0 | wasm | 1.410 | 1.382–1.510 | 444.7 | 447.5 | 0.647 |
| props | 0 | escape-html | 1.390 | 1.337–1.434 | 427.8 | 433.9 | 0.301 |
| props | 0 | fast-escape-html | 1.362 | 1.347–1.377 | 423.8 | 426.2 | 0.391 |
| props | 0 | html-escaper | 1.432 | 1.414–1.477 | 446.1 | 451.7 | 0.337 |
| props | 2 | native | 1.507 | 1.489–1.525 | 575.8 | 580.9 | 3.482 |
| props | 2 | wasm | 1.505 | 1.457–1.549 | 575.6 | 593.8 | 7.342 |
| props | 2 | escape-html | 1.483 | 1.448–1.513 | 577.4 | 580.9 | 0.568 |
| props | 2 | fast-escape-html | 1.493 | 1.460–1.563 | 576.5 | 583.8 | 0.671 |
| props | 2 | html-escaper | 1.504 | 1.485–1.509 | 582.6 | 587.7 | 0.577 |

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
