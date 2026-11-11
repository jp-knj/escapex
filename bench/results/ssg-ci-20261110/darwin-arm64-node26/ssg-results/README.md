# Full Astro static-build comparison

darwin arm64; Apple M1 (Virtual); Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T14:03:56.266Z. Completed: 2026-11-10T14:08:53.708Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.959 | 1.630–2.274 | 360.1 | 360.5 | 2.386 |
| articles | 0 | wasm | 1.750 | 1.511–2.034 | 362.5 | 366.8 | 0.771 |
| articles | 0 | escape-html | 1.704 | 1.577–2.239 | 360.1 | 372.8 | 1.414 |
| articles | 0 | fast-escape-html | 1.921 | 1.790–2.141 | 359.9 | 365.7 | 1.000 |
| articles | 0 | html-escaper | 1.895 | 1.606–2.020 | 360.4 | 362.0 | 1.784 |
| articles | 2 | native | 1.874 | 1.789–5.980 | 472.2 | 475.7 | 3.315 |
| articles | 2 | wasm | 2.021 | 1.710–3.013 | 473.2 | 475.7 | 1.009 |
| articles | 2 | escape-html | 1.849 | 1.729–2.426 | 471.5 | 477.4 | 0.473 |
| articles | 2 | fast-escape-html | 1.902 | 1.841–2.560 | 466.8 | 474.7 | 0.498 |
| articles | 2 | html-escaper | 1.930 | 1.885–2.112 | 469.2 | 475.6 | 0.500 |
| catalog | 0 | native | 1.073 | 0.924–1.481 | 344.6 | 353.3 | 1.346 |
| catalog | 0 | wasm | 1.327 | 0.968–1.428 | 346.1 | 349.1 | 0.637 |
| catalog | 0 | escape-html | 1.239 | 0.968–1.418 | 345.5 | 348.3 | 0.345 |
| catalog | 0 | fast-escape-html | 1.258 | 0.973–1.500 | 345.6 | 350.4 | 0.327 |
| catalog | 0 | html-escaper | 1.079 | 0.999–1.239 | 344.0 | 347.6 | 0.264 |
| catalog | 2 | native | 1.531 | 1.497–2.157 | 411.0 | 412.5 | 2.908 |
| catalog | 2 | wasm | 1.927 | 1.398–2.117 | 411.5 | 415.0 | 0.797 |
| catalog | 2 | escape-html | 1.858 | 1.492–2.551 | 410.7 | 412.3 | 0.559 |
| catalog | 2 | fast-escape-html | 2.029 | 1.344–2.744 | 411.8 | 414.0 | 0.550 |
| catalog | 2 | html-escaper | 1.429 | 1.179–2.649 | 411.0 | 411.4 | 0.470 |
| props | 0 | native | 1.585 | 1.300–1.916 | 445.1 | 448.9 | 1.828 |
| props | 0 | wasm | 1.870 | 1.339–2.058 | 440.0 | 469.7 | 0.863 |
| props | 0 | escape-html | 2.109 | 1.699–3.167 | 404.7 | 407.4 | 0.530 |
| props | 0 | fast-escape-html | 1.957 | 1.480–2.120 | 402.0 | 409.6 | 0.412 |
| props | 0 | html-escaper | 1.784 | 1.686–2.027 | 423.8 | 444.0 | 0.587 |
| props | 2 | native | 1.879 | 1.140–2.426 | 554.7 | 567.9 | 2.626 |
| props | 2 | wasm | 1.956 | 1.248–2.360 | 544.5 | 560.6 | 1.054 |
| props | 2 | escape-html | 1.485 | 1.294–2.296 | 531.2 | 556.4 | 0.410 |
| props | 2 | fast-escape-html | 1.505 | 1.405–1.566 | 536.5 | 544.4 | 0.471 |
| props | 2 | html-escaper | 1.466 | 1.296–2.062 | 546.3 | 554.7 | 0.538 |

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
