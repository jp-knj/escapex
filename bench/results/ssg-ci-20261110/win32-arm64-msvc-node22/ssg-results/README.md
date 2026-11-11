# Full Astro static-build comparison

win32 arm64; Cobalt 100; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T14:01:13.675Z. Completed: 2026-11-10T14:11:40.398Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 4.560 | 4.454–4.730 | 251.6 | 255.1 | 3.273 |
| articles | 0 | wasm | 4.606 | 4.445–4.656 | 252.0 | 253.8 | 1.480 |
| articles | 0 | escape-html | 4.587 | 4.496–5.851 | 250.6 | 253.1 | 1.022 |
| articles | 0 | fast-escape-html | 4.634 | 4.501–4.853 | 251.5 | 253.5 | 1.259 |
| articles | 0 | html-escaper | 4.509 | 4.436–4.728 | 251.1 | 255.5 | 1.174 |
| articles | 2 | native | 4.264 | 4.246–4.589 | 351.0 | 353.0 | 6.269 |
| articles | 2 | wasm | 4.332 | 4.218–4.374 | 354.2 | 355.1 | 4.377 |
| articles | 2 | escape-html | 4.262 | 4.220–4.320 | 352.1 | 355.9 | 3.054 |
| articles | 2 | fast-escape-html | 4.284 | 4.253–4.529 | 352.7 | 354.1 | 3.058 |
| articles | 2 | html-escaper | 4.326 | 4.250–4.375 | 352.7 | 356.8 | 3.087 |
| catalog | 0 | native | 3.158 | 3.110–3.982 | 241.3 | 245.8 | 3.228 |
| catalog | 0 | wasm | 3.128 | 3.110–3.132 | 243.2 | 245.9 | 1.546 |
| catalog | 0 | escape-html | 3.138 | 3.082–3.386 | 240.7 | 245.2 | 1.034 |
| catalog | 0 | fast-escape-html | 3.146 | 3.071–3.490 | 241.5 | 243.3 | 1.228 |
| catalog | 0 | html-escaper | 3.192 | 3.063–3.276 | 242.7 | 244.6 | 1.117 |
| catalog | 2 | native | 3.214 | 3.208–3.533 | 314.6 | 316.9 | 6.073 |
| catalog | 2 | wasm | 3.281 | 3.221–3.489 | 314.7 | 315.8 | 5.204 |
| catalog | 2 | escape-html | 3.251 | 3.236–3.527 | 313.3 | 316.4 | 2.965 |
| catalog | 2 | fast-escape-html | 3.260 | 3.217–3.357 | 313.8 | 318.7 | 2.879 |
| catalog | 2 | html-escaper | 3.213 | 3.179–3.429 | 317.2 | 321.1 | 3.013 |
| props | 0 | native | 2.948 | 2.911–2.956 | 285.3 | 286.1 | 3.350 |
| props | 0 | wasm | 2.995 | 2.981–3.067 | 286.7 | 287.1 | 1.526 |
| props | 0 | escape-html | 2.970 | 2.947–3.005 | 268.8 | 269.5 | 1.102 |
| props | 0 | fast-escape-html | 2.975 | 2.930–3.021 | 269.4 | 270.5 | 1.214 |
| props | 0 | html-escaper | 3.028 | 3.025–3.129 | 289.1 | 290.4 | 1.064 |
| props | 2 | native | 3.144 | 3.099–3.236 | 398.4 | 401.9 | 6.160 |
| props | 2 | wasm | 3.159 | 3.120–3.214 | 409.9 | 417.6 | 6.056 |
| props | 2 | escape-html | 3.142 | 3.126–3.168 | 410.7 | 413.9 | 2.851 |
| props | 2 | fast-escape-html | 3.176 | 3.136–3.490 | 410.4 | 412.2 | 2.941 |
| props | 2 | html-escaper | 3.194 | 3.164–3.199 | 418.7 | 424.4 | 2.820 |

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
