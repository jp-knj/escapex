# Full Astro static-build comparison

win32 arm64; Cobalt 100; Node v24.22.2; Astro 7.4.8.

Started: 2026-11-10T14:01:07.635Z. Completed: 2026-11-10T14:11:25.257Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 4.274 | 4.169–4.409 | 358.4 | 366.0 | 2.940 |
| articles | 0 | wasm | 4.253 | 4.215–4.622 | 358.8 | 362.8 | 1.329 |
| articles | 0 | escape-html | 4.137 | 4.104–4.273 | 364.7 | 368.7 | 0.995 |
| articles | 0 | fast-escape-html | 4.218 | 3.973–4.356 | 358.4 | 362.4 | 1.145 |
| articles | 0 | html-escaper | 4.233 | 4.120–5.061 | 357.4 | 365.0 | 1.028 |
| articles | 2 | native | 4.151 | 4.075–4.215 | 446.3 | 489.5 | 6.862 |
| articles | 2 | wasm | 4.122 | 4.033–4.281 | 438.9 | 447.1 | 2.328 |
| articles | 2 | escape-html | 4.176 | 4.081–4.252 | 431.4 | 445.5 | 3.322 |
| articles | 2 | fast-escape-html | 4.266 | 4.099–4.508 | 436.2 | 445.9 | 3.470 |
| articles | 2 | html-escaper | 4.172 | 4.092–4.211 | 441.4 | 452.8 | 3.501 |
| catalog | 0 | native | 2.979 | 2.945–3.854 | 334.9 | 335.6 | 2.879 |
| catalog | 0 | wasm | 3.004 | 2.872–3.175 | 337.2 | 343.7 | 1.321 |
| catalog | 0 | escape-html | 3.003 | 2.946–3.098 | 336.3 | 356.6 | 1.017 |
| catalog | 0 | fast-escape-html | 3.037 | 3.003–3.128 | 335.7 | 356.9 | 1.166 |
| catalog | 0 | html-escaper | 3.052 | 2.974–3.107 | 336.0 | 370.1 | 1.072 |
| catalog | 2 | native | 3.329 | 3.176–3.604 | 415.3 | 429.7 | 6.467 |
| catalog | 2 | wasm | 3.296 | 3.139–3.843 | 387.9 | 416.3 | 2.090 |
| catalog | 2 | escape-html | 3.279 | 3.178–3.374 | 414.4 | 429.1 | 3.329 |
| catalog | 2 | fast-escape-html | 3.244 | 3.185–3.421 | 411.8 | 429.8 | 3.544 |
| catalog | 2 | html-escaper | 3.229 | 3.183–3.481 | 404.6 | 406.8 | 3.256 |
| props | 0 | native | 3.095 | 3.082–3.195 | 394.8 | 398.9 | 3.006 |
| props | 0 | wasm | 3.115 | 3.084–3.191 | 401.4 | 403.4 | 1.398 |
| props | 0 | escape-html | 3.209 | 3.163–3.307 | 416.1 | 416.2 | 1.034 |
| props | 0 | fast-escape-html | 3.237 | 3.196–3.265 | 414.1 | 416.4 | 1.218 |
| props | 0 | html-escaper | 3.217 | 3.160–3.270 | 417.0 | 418.3 | 1.112 |
| props | 2 | native | 3.224 | 3.117–3.342 | 510.2 | 521.3 | 7.304 |
| props | 2 | wasm | 3.230 | 3.168–3.335 | 505.9 | 531.3 | 4.006 |
| props | 2 | escape-html | 3.249 | 3.220–3.359 | 499.5 | 508.7 | 3.401 |
| props | 2 | fast-escape-html | 3.298 | 3.204–3.326 | 496.3 | 498.6 | 3.586 |
| props | 2 | html-escaper | 3.249 | 3.221–3.311 | 505.8 | 521.0 | 3.487 |

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
