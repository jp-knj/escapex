# Full Astro static-build comparison

win32 x64; INTEL(R) XEON(R) PLATINUM 8573C; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T13:59:24.878Z. Completed: 2026-11-10T14:05:13.400Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 2.213 | 2.201–2.234 | 357.4 | 359.4 | 1.621 |
| articles | 0 | wasm | 2.219 | 2.202–2.230 | 358.0 | 359.0 | 0.866 |
| articles | 0 | escape-html | 2.198 | 2.196–2.224 | 359.1 | 360.3 | 0.511 |
| articles | 0 | fast-escape-html | 2.205 | 2.203–2.231 | 358.6 | 359.5 | 0.592 |
| articles | 0 | html-escaper | 2.208 | 2.205–2.216 | 357.1 | 358.2 | 0.548 |
| articles | 2 | native | 2.396 | 2.367–2.488 | 451.4 | 452.6 | 2.930 |
| articles | 2 | wasm | 2.394 | 2.359–2.558 | 443.4 | 479.8 | 1.440 |
| articles | 2 | escape-html | 2.369 | 2.348–2.386 | 449.8 | 451.8 | 0.928 |
| articles | 2 | fast-escape-html | 2.366 | 2.359–2.423 | 450.7 | 451.4 | 0.929 |
| articles | 2 | html-escaper | 2.368 | 2.344–3.101 | 451.0 | 451.8 | 0.861 |
| catalog | 0 | native | 1.700 | 1.688–1.709 | 347.7 | 347.8 | 1.601 |
| catalog | 0 | wasm | 1.715 | 1.695–1.723 | 348.6 | 349.5 | 0.803 |
| catalog | 0 | escape-html | 1.705 | 1.688–1.712 | 347.3 | 347.7 | 0.507 |
| catalog | 0 | fast-escape-html | 1.700 | 1.687–1.704 | 347.1 | 347.8 | 0.586 |
| catalog | 0 | html-escaper | 1.700 | 1.690–1.705 | 348.7 | 349.9 | 0.536 |
| catalog | 2 | native | 1.885 | 1.874–1.891 | 421.6 | 430.5 | 2.890 |
| catalog | 2 | wasm | 1.895 | 1.888–1.904 | 395.1 | 403.9 | 4.057 |
| catalog | 2 | escape-html | 1.897 | 1.870–1.903 | 425.3 | 426.9 | 0.797 |
| catalog | 2 | fast-escape-html | 1.881 | 1.862–1.894 | 425.5 | 426.6 | 0.930 |
| catalog | 2 | html-escaper | 1.891 | 1.879–1.909 | 418.4 | 421.2 | 0.811 |
| props | 0 | native | 1.941 | 1.906–1.964 | 372.1 | 377.7 | 1.620 |
| props | 0 | wasm | 1.984 | 1.954–2.085 | 371.8 | 373.5 | 0.822 |
| props | 0 | escape-html | 1.943 | 1.934–2.044 | 397.8 | 398.8 | 0.492 |
| props | 0 | fast-escape-html | 1.946 | 1.932–1.966 | 397.7 | 399.2 | 0.582 |
| props | 0 | html-escaper | 2.027 | 1.998–2.029 | 391.6 | 393.3 | 0.526 |
| props | 2 | native | 2.061 | 2.029–2.079 | 499.9 | 515.6 | 2.970 |
| props | 2 | wasm | 2.088 | 2.084–2.140 | 492.1 | 512.1 | 1.450 |
| props | 2 | escape-html | 2.095 | 2.073–2.109 | 476.1 | 480.2 | 0.843 |
| props | 2 | fast-escape-html | 2.105 | 2.072–2.145 | 482.0 | 492.6 | 0.941 |
| props | 2 | html-escaper | 2.099 | 2.084–2.109 | 482.7 | 500.7 | 0.893 |

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
