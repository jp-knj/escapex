# Full Astro static-build comparison

linux x64; AMD EPYC 9V74 80-Core Processor; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T13:59:00.596Z. Completed: 2026-11-10T14:02:57.198Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.468 | 1.467–1.476 | 494.9 | 501.8 | 3.267 |
| articles | 0 | wasm | 1.470 | 1.454–1.481 | 497.7 | 504.2 | 0.632 |
| articles | 0 | escape-html | 1.476 | 1.460–1.525 | 500.5 | 502.9 | 0.246 |
| articles | 0 | fast-escape-html | 1.477 | 1.467–1.600 | 500.4 | 505.3 | 0.336 |
| articles | 0 | html-escaper | 1.473 | 1.452–1.543 | 498.6 | 502.5 | 0.274 |
| articles | 2 | native | 1.672 | 1.646–1.681 | 620.9 | 624.6 | 4.454 |
| articles | 2 | wasm | 1.658 | 1.644–1.703 | 615.0 | 622.8 | 1.061 |
| articles | 2 | escape-html | 1.650 | 1.639–1.730 | 621.1 | 625.5 | 0.499 |
| articles | 2 | fast-escape-html | 1.651 | 1.635–1.663 | 614.8 | 622.8 | 0.616 |
| articles | 2 | html-escaper | 1.667 | 1.642–1.696 | 619.0 | 626.4 | 0.496 |
| catalog | 0 | native | 1.214 | 1.208–1.229 | 465.1 | 474.4 | 3.231 |
| catalog | 0 | wasm | 1.226 | 1.205–1.228 | 472.7 | 476.6 | 0.631 |
| catalog | 0 | escape-html | 1.215 | 1.209–1.251 | 470.1 | 474.2 | 0.236 |
| catalog | 0 | fast-escape-html | 1.206 | 1.194–1.236 | 470.1 | 477.1 | 0.319 |
| catalog | 0 | html-escaper | 1.213 | 1.204–1.240 | 472.2 | 477.0 | 0.277 |
| catalog | 2 | native | 1.366 | 1.343–1.381 | 551.5 | 557.4 | 4.158 |
| catalog | 2 | wasm | 1.390 | 1.362–1.396 | 550.0 | 553.0 | 2.156 |
| catalog | 2 | escape-html | 1.357 | 1.335–1.401 | 545.8 | 556.0 | 0.498 |
| catalog | 2 | fast-escape-html | 1.351 | 1.338–1.362 | 547.5 | 548.4 | 0.589 |
| catalog | 2 | html-escaper | 1.351 | 1.332–1.393 | 545.1 | 554.0 | 0.508 |
| props | 0 | native | 1.316 | 1.299–1.359 | 545.5 | 550.8 | 3.233 |
| props | 0 | wasm | 1.381 | 1.361–1.439 | 551.6 | 557.0 | 0.637 |
| props | 0 | escape-html | 1.335 | 1.300–1.343 | 518.9 | 520.4 | 0.244 |
| props | 0 | fast-escape-html | 1.327 | 1.322–1.333 | 516.9 | 524.6 | 0.315 |
| props | 0 | html-escaper | 1.357 | 1.348–1.390 | 545.4 | 550.4 | 0.283 |
| props | 2 | native | 1.434 | 1.425–1.449 | 690.0 | 695.5 | 4.163 |
| props | 2 | wasm | 1.477 | 1.449–1.490 | 693.5 | 698.2 | 1.261 |
| props | 2 | escape-html | 1.468 | 1.452–1.519 | 684.6 | 697.9 | 0.499 |
| props | 2 | fast-escape-html | 1.488 | 1.469–1.500 | 667.3 | 700.3 | 0.557 |
| props | 2 | html-escaper | 1.483 | 1.479–1.502 | 689.6 | 706.8 | 0.509 |

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
