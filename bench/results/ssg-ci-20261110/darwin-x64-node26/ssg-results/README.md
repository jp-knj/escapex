# Full Astro static-build comparison

darwin x64; Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz; Node v26.13.0; Astro 7.4.8.

Started: 2026-11-10T14:01:32.447Z. Completed: 2026-11-10T14:12:29.381Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 5.464 | 5.068–7.239 | 324.1 | 326.6 | 3.558 |
| articles | 0 | wasm | 5.262 | 4.567–6.444 | 325.3 | 329.1 | 1.755 |
| articles | 0 | escape-html | 5.199 | 4.643–6.879 | 323.7 | 328.9 | 0.680 |
| articles | 0 | fast-escape-html | 5.520 | 4.173–6.742 | 328.1 | 329.4 | 0.942 |
| articles | 0 | html-escaper | 4.842 | 4.192–7.218 | 324.2 | 330.4 | 0.712 |
| articles | 2 | native | 5.588 | 3.314–6.921 | 442.4 | 445.2 | 5.924 |
| articles | 2 | wasm | 5.191 | 3.097–7.983 | 438.4 | 439.5 | 2.522 |
| articles | 2 | escape-html | 4.325 | 3.054–6.833 | 438.8 | 442.6 | 0.997 |
| articles | 2 | fast-escape-html | 5.062 | 3.140–5.759 | 441.6 | 444.0 | 1.369 |
| articles | 2 | html-escaper | 5.689 | 3.149–7.393 | 437.6 | 442.8 | 1.442 |
| catalog | 0 | native | 2.955 | 2.878–3.043 | 312.9 | 313.0 | 2.682 |
| catalog | 0 | wasm | 3.163 | 2.610–3.786 | 311.1 | 317.1 | 1.486 |
| catalog | 0 | escape-html | 3.136 | 2.788–3.178 | 310.3 | 313.2 | 0.504 |
| catalog | 0 | fast-escape-html | 3.054 | 2.765–3.565 | 309.2 | 310.7 | 0.717 |
| catalog | 0 | html-escaper | 3.033 | 2.759–3.823 | 307.7 | 312.1 | 0.676 |
| catalog | 2 | native | 2.953 | 2.614–3.242 | 386.8 | 387.1 | 5.006 |
| catalog | 2 | wasm | 2.947 | 2.670–3.328 | 388.5 | 390.0 | 2.496 |
| catalog | 2 | escape-html | 3.069 | 2.654–3.227 | 387.2 | 388.6 | 1.100 |
| catalog | 2 | fast-escape-html | 3.068 | 2.439–3.953 | 387.2 | 387.9 | 1.388 |
| catalog | 2 | html-escaper | 2.925 | 2.361–3.188 | 384.4 | 387.6 | 1.103 |
| props | 0 | native | 2.982 | 2.864–3.720 | 386.6 | 389.6 | 2.634 |
| props | 0 | wasm | 3.185 | 2.910–3.616 | 387.7 | 390.9 | 1.254 |
| props | 0 | escape-html | 3.130 | 2.725–3.296 | 353.3 | 354.1 | 0.606 |
| props | 0 | fast-escape-html | 2.823 | 2.473–3.112 | 353.5 | 355.6 | 0.584 |
| props | 0 | html-escaper | 3.357 | 3.113–3.422 | 379.4 | 381.4 | 0.718 |
| props | 2 | native | 2.689 | 2.618–2.853 | 513.3 | 514.9 | 4.330 |
| props | 2 | wasm | 2.867 | 2.524–3.611 | 485.0 | 508.6 | 1.533 |
| props | 2 | escape-html | 2.598 | 2.488–3.308 | 506.2 | 512.1 | 0.907 |
| props | 2 | fast-escape-html | 2.617 | 2.463–2.774 | 505.1 | 505.9 | 0.937 |
| props | 2 | html-escaper | 2.653 | 2.627–2.933 | 504.0 | 519.5 | 0.944 |

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
