# Full Astro static-build comparison

linux x64; AMD EPYC 9V74 80-Core Processor; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T13:58:55.940Z. Completed: 2026-11-10T14:03:09.059Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.640 | 1.624–1.655 | 422.3 | 429.7 | 4.049 |
| articles | 0 | wasm | 1.669 | 1.633–1.883 | 424.9 | 429.0 | 0.741 |
| articles | 0 | escape-html | 1.640 | 1.632–1.820 | 423.8 | 435.8 | 0.250 |
| articles | 0 | fast-escape-html | 1.633 | 1.623–1.659 | 426.3 | 431.6 | 0.382 |
| articles | 0 | html-escaper | 1.640 | 1.631–1.873 | 426.0 | 428.7 | 0.313 |
| articles | 2 | native | 1.818 | 1.805–1.836 | 535.8 | 545.1 | 5.403 |
| articles | 2 | wasm | 1.817 | 1.805–1.853 | 532.9 | 534.5 | 4.158 |
| articles | 2 | escape-html | 1.817 | 1.791–1.827 | 530.8 | 536.3 | 0.506 |
| articles | 2 | fast-escape-html | 1.810 | 1.804–1.822 | 526.0 | 531.9 | 0.571 |
| articles | 2 | html-escaper | 1.809 | 1.800–1.833 | 534.9 | 550.0 | 0.498 |
| catalog | 0 | native | 1.248 | 1.243–1.281 | 417.2 | 418.9 | 4.060 |
| catalog | 0 | wasm | 1.271 | 1.261–1.307 | 411.5 | 416.4 | 0.706 |
| catalog | 0 | escape-html | 1.253 | 1.235–1.307 | 411.2 | 417.3 | 0.265 |
| catalog | 0 | fast-escape-html | 1.249 | 1.237–1.251 | 409.1 | 418.7 | 0.351 |
| catalog | 0 | html-escaper | 1.249 | 1.235–1.262 | 413.6 | 421.6 | 0.288 |
| catalog | 2 | native | 1.424 | 1.414–1.438 | 501.0 | 511.3 | 5.483 |
| catalog | 2 | wasm | 1.409 | 1.403–1.439 | 497.8 | 504.5 | 4.086 |
| catalog | 2 | escape-html | 1.412 | 1.404–1.414 | 488.7 | 496.5 | 0.505 |
| catalog | 2 | fast-escape-html | 1.412 | 1.389–1.420 | 501.8 | 507.3 | 0.588 |
| catalog | 2 | html-escaper | 1.415 | 1.397–1.428 | 489.1 | 505.6 | 0.543 |
| props | 0 | native | 1.367 | 1.349–1.443 | 451.8 | 457.0 | 4.046 |
| props | 0 | wasm | 1.428 | 1.406–1.437 | 452.6 | 454.8 | 0.706 |
| props | 0 | escape-html | 1.391 | 1.372–1.412 | 437.8 | 441.6 | 0.246 |
| props | 0 | fast-escape-html | 1.387 | 1.370–1.389 | 432.0 | 433.7 | 0.336 |
| props | 0 | html-escaper | 1.570 | 1.560–1.590 | 448.6 | 464.7 | 0.294 |
| props | 2 | native | 1.459 | 1.436–1.473 | 604.0 | 623.8 | 5.496 |
| props | 2 | wasm | 1.514 | 1.491–1.567 | 597.0 | 613.8 | 4.069 |
| props | 2 | escape-html | 1.469 | 1.450–1.528 | 589.0 | 594.4 | 0.466 |
| props | 2 | fast-escape-html | 1.489 | 1.463–1.511 | 602.3 | 607.2 | 0.552 |
| props | 2 | html-escaper | 1.526 | 1.516–1.543 | 605.3 | 610.1 | 0.564 |

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
