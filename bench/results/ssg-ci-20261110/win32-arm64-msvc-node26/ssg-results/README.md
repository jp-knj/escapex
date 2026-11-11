# Full Astro static-build comparison

win32 arm64; Cobalt 100; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T14:01:47.177Z. Completed: 2026-11-10T14:10:19.036Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 3.541 | 3.507–3.713 | 310.8 | 313.3 | 2.519 |
| articles | 0 | wasm | 3.577 | 3.553–3.658 | 307.7 | 315.5 | 1.240 |
| articles | 0 | escape-html | 3.564 | 3.528–3.620 | 307.6 | 310.8 | 0.902 |
| articles | 0 | fast-escape-html | 3.589 | 3.466–3.667 | 308.9 | 310.9 | 1.016 |
| articles | 0 | html-escaper | 3.595 | 3.523–3.611 | 310.2 | 319.3 | 0.975 |
| articles | 2 | native | 3.551 | 3.526–3.621 | 440.3 | 442.8 | 4.898 |
| articles | 2 | wasm | 3.597 | 3.444–3.930 | 430.9 | 442.7 | 3.554 |
| articles | 2 | escape-html | 3.617 | 3.420–4.275 | 436.2 | 441.9 | 2.567 |
| articles | 2 | fast-escape-html | 3.636 | 3.464–3.991 | 433.7 | 438.4 | 2.687 |
| articles | 2 | html-escaper | 3.569 | 3.493–3.908 | 425.0 | 436.6 | 2.470 |
| catalog | 0 | native | 2.485 | 2.461–2.790 | 305.5 | 312.4 | 2.482 |
| catalog | 0 | wasm | 2.535 | 2.469–2.914 | 305.4 | 315.5 | 1.318 |
| catalog | 0 | escape-html | 2.464 | 2.444–2.759 | 301.9 | 313.2 | 0.929 |
| catalog | 0 | fast-escape-html | 2.536 | 2.512–2.824 | 305.3 | 308.6 | 1.026 |
| catalog | 0 | html-escaper | 2.503 | 2.445–2.764 | 301.1 | 313.8 | 0.966 |
| catalog | 2 | native | 2.610 | 2.553–2.871 | 391.9 | 398.6 | 5.093 |
| catalog | 2 | wasm | 2.577 | 2.546–2.878 | 379.1 | 386.4 | 6.786 |
| catalog | 2 | escape-html | 2.592 | 2.574–2.922 | 384.8 | 393.3 | 2.466 |
| catalog | 2 | fast-escape-html | 2.554 | 2.523–2.861 | 386.0 | 387.0 | 2.375 |
| catalog | 2 | html-escaper | 2.579 | 2.561–2.914 | 384.6 | 395.4 | 2.488 |
| props | 0 | native | 2.428 | 2.400–2.491 | 369.4 | 372.3 | 2.585 |
| props | 0 | wasm | 2.475 | 2.449–2.583 | 371.9 | 373.9 | 1.229 |
| props | 0 | escape-html | 2.467 | 2.430–2.587 | 340.4 | 347.6 | 0.906 |
| props | 0 | fast-escape-html | 2.462 | 2.448–2.468 | 338.6 | 347.1 | 1.031 |
| props | 0 | html-escaper | 2.532 | 2.520–2.850 | 368.5 | 374.1 | 0.959 |
| props | 2 | native | 2.534 | 2.502–2.775 | 506.7 | 508.4 | 5.149 |
| props | 2 | wasm | 2.553 | 2.529–2.572 | 506.9 | 531.4 | 7.082 |
| props | 2 | escape-html | 2.559 | 2.542–2.619 | 487.4 | 497.4 | 2.442 |
| props | 2 | fast-escape-html | 2.582 | 2.531–2.594 | 490.2 | 494.5 | 2.677 |
| props | 2 | html-escaper | 2.579 | 2.536–2.621 | 500.3 | 513.5 | 2.446 |

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
