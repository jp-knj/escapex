# Full Astro static-build comparison

darwin x64; Intel(R) Core(TM) i7-8700B CPU @ 3.20GHz; Node v24.19.0; Astro 7.4.8.

Started: 2026-11-10T14:05:51.325Z. Completed: 2026-11-10T14:19:53.112Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 5.916 | 5.737–8.514 | 365.3 | 368.7 | 3.863 |
| articles | 0 | wasm | 5.869 | 4.959–7.186 | 367.4 | 374.4 | 1.464 |
| articles | 0 | escape-html | 5.517 | 4.978–7.468 | 367.6 | 371.6 | 0.729 |
| articles | 0 | fast-escape-html | 6.249 | 5.836–6.748 | 364.5 | 371.1 | 1.025 |
| articles | 0 | html-escaper | 6.526 | 5.445–7.528 | 368.1 | 374.8 | 0.999 |
| articles | 2 | native | 6.807 | 5.451–7.642 | 463.5 | 469.3 | 7.848 |
| articles | 2 | wasm | 6.120 | 5.671–9.054 | 465.5 | 474.3 | 2.452 |
| articles | 2 | escape-html | 6.053 | 4.582–9.593 | 465.8 | 471.1 | 1.324 |
| articles | 2 | fast-escape-html | 5.764 | 5.210–10.787 | 462.9 | 468.7 | 1.530 |
| articles | 2 | html-escaper | 5.381 | 4.915–6.088 | 463.2 | 469.3 | 1.416 |
| catalog | 0 | native | 3.881 | 3.587–4.442 | 347.3 | 351.7 | 4.278 |
| catalog | 0 | wasm | 4.098 | 3.623–4.766 | 347.4 | 351.6 | 1.573 |
| catalog | 0 | escape-html | 3.822 | 3.248–4.421 | 348.7 | 350.1 | 0.782 |
| catalog | 0 | fast-escape-html | 3.330 | 3.183–4.465 | 349.8 | 354.9 | 0.977 |
| catalog | 0 | html-escaper | 3.590 | 3.106–3.704 | 348.1 | 348.3 | 0.822 |
| catalog | 2 | native | 3.765 | 3.322–3.986 | 438.6 | 440.9 | 5.835 |
| catalog | 2 | wasm | 3.932 | 3.331–5.750 | 413.4 | 415.1 | 2.257 |
| catalog | 2 | escape-html | 3.648 | 3.066–5.056 | 413.4 | 428.8 | 1.354 |
| catalog | 2 | fast-escape-html | 3.366 | 3.103–4.568 | 413.8 | 415.5 | 1.414 |
| catalog | 2 | html-escaper | 3.647 | 3.103–4.209 | 413.1 | 414.5 | 1.352 |
| props | 0 | native | 3.851 | 3.706–5.878 | 401.3 | 403.8 | 2.765 |
| props | 0 | wasm | 4.477 | 3.884–5.853 | 404.4 | 406.6 | 1.364 |
| props | 0 | escape-html | 4.026 | 3.607–4.849 | 414.1 | 418.7 | 0.526 |
| props | 0 | fast-escape-html | 4.018 | 3.696–4.485 | 415.5 | 415.8 | 0.934 |
| props | 0 | html-escaper | 4.811 | 4.234–5.182 | 419.1 | 420.3 | 0.793 |
| props | 2 | native | 3.659 | 2.949–4.426 | 530.5 | 540.7 | 5.778 |
| props | 2 | wasm | 3.548 | 3.099–4.154 | 513.3 | 551.6 | 2.337 |
| props | 2 | escape-html | 3.482 | 2.886–4.192 | 493.9 | 495.3 | 1.155 |
| props | 2 | fast-escape-html | 3.476 | 2.895–3.601 | 496.9 | 510.3 | 1.327 |
| props | 2 | html-escaper | 3.574 | 3.143–3.819 | 502.3 | 509.0 | 1.271 |

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
