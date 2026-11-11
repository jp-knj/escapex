# Full Astro static-build comparison

win32 x64; AMD EPYC 7763 64-Core Processor                ; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T14:04:27.178Z. Completed: 2026-11-10T14:13:09.060Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 3.404 | 3.365–3.423 | 244.8 | 244.9 | 2.440 |
| articles | 0 | wasm | 3.413 | 3.390–3.484 | 244.6 | 245.3 | 1.234 |
| articles | 0 | escape-html | 3.409 | 3.365–3.429 | 244.4 | 245.4 | 0.775 |
| articles | 0 | fast-escape-html | 3.409 | 3.379–3.655 | 244.5 | 245.7 | 0.953 |
| articles | 0 | html-escaper | 3.403 | 3.372–3.933 | 244.6 | 245.0 | 0.827 |
| articles | 2 | native | 3.662 | 3.610–3.689 | 349.1 | 349.4 | 4.353 |
| articles | 2 | wasm | 3.643 | 3.611–3.705 | 349.7 | 349.9 | 6.069 |
| articles | 2 | escape-html | 3.659 | 3.589–3.767 | 348.4 | 350.6 | 1.803 |
| articles | 2 | fast-escape-html | 3.653 | 3.602–3.680 | 348.5 | 349.1 | 1.473 |
| articles | 2 | html-escaper | 3.656 | 3.579–3.719 | 348.0 | 349.8 | 1.640 |
| catalog | 0 | native | 2.628 | 2.625–2.668 | 232.3 | 233.1 | 2.518 |
| catalog | 0 | wasm | 2.681 | 2.630–2.692 | 232.3 | 233.1 | 1.227 |
| catalog | 0 | escape-html | 2.673 | 2.651–2.678 | 231.9 | 233.5 | 0.791 |
| catalog | 0 | fast-escape-html | 2.652 | 2.618–2.664 | 231.9 | 234.1 | 0.925 |
| catalog | 0 | html-escaper | 2.657 | 2.621–2.693 | 231.7 | 233.2 | 0.825 |
| catalog | 2 | native | 2.955 | 2.922–2.984 | 308.3 | 308.9 | 4.157 |
| catalog | 2 | wasm | 2.960 | 2.956–3.002 | 308.4 | 309.2 | 7.587 |
| catalog | 2 | escape-html | 2.964 | 2.875–3.005 | 309.3 | 309.5 | 1.384 |
| catalog | 2 | fast-escape-html | 2.917 | 2.884–2.968 | 307.7 | 308.7 | 1.370 |
| catalog | 2 | html-escaper | 2.939 | 2.888–2.960 | 307.0 | 314.0 | 1.724 |
| props | 0 | native | 2.804 | 2.748–2.851 | 270.2 | 270.4 | 2.400 |
| props | 0 | wasm | 2.862 | 2.824–2.909 | 269.2 | 270.0 | 1.254 |
| props | 0 | escape-html | 2.845 | 2.797–2.983 | 253.6 | 255.1 | 0.774 |
| props | 0 | fast-escape-html | 2.841 | 2.803–2.867 | 253.5 | 254.9 | 0.906 |
| props | 0 | html-escaper | 2.925 | 2.870–3.001 | 272.6 | 273.6 | 0.875 |
| props | 2 | native | 2.992 | 2.976–3.051 | 397.8 | 417.3 | 4.027 |
| props | 2 | wasm | 3.070 | 3.061–3.111 | 424.4 | 426.0 | 9.059 |
| props | 2 | escape-html | 3.009 | 2.993–3.066 | 404.5 | 405.9 | 1.854 |
| props | 2 | fast-escape-html | 3.063 | 3.016–3.070 | 400.9 | 404.0 | 1.655 |
| props | 2 | html-escaper | 3.077 | 3.029–3.118 | 415.8 | 424.3 | 1.506 |

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
