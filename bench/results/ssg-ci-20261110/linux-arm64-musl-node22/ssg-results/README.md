# Full Astro static-build comparison

linux arm64; unknown; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T13:59:25.944Z. Completed: 2026-11-10T14:05:23.080Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 2.436 | 2.367–2.500 | 442.9 | 445.5 | 3.209 |
| articles | 0 | wasm | 2.436 | 2.405–2.497 | 431.1 | 450.9 | 0.896 |
| articles | 0 | escape-html | 2.417 | 2.416–2.429 | 433.0 | 438.5 | 0.351 |
| articles | 0 | fast-escape-html | 2.434 | 2.371–2.442 | 442.8 | 445.1 | 0.492 |
| articles | 0 | html-escaper | 2.443 | 2.427–2.455 | 438.9 | 446.9 | 0.443 |
| articles | 2 | native | 2.579 | 2.490–2.604 | 544.9 | 555.3 | 4.427 |
| articles | 2 | wasm | 2.529 | 2.510–2.552 | 533.0 | 546.9 | 7.413 |
| articles | 2 | escape-html | 2.559 | 2.483–2.582 | 542.4 | 546.6 | 0.796 |
| articles | 2 | fast-escape-html | 2.531 | 2.478–2.577 | 540.1 | 548.6 | 0.920 |
| articles | 2 | html-escaper | 2.580 | 2.513–2.592 | 538.3 | 553.1 | 0.872 |
| catalog | 0 | native | 1.801 | 1.784–1.848 | 431.9 | 437.7 | 3.329 |
| catalog | 0 | wasm | 1.841 | 1.800–1.875 | 437.9 | 445.8 | 0.950 |
| catalog | 0 | escape-html | 1.825 | 1.805–1.857 | 430.9 | 442.7 | 0.361 |
| catalog | 0 | fast-escape-html | 1.826 | 1.768–1.832 | 424.8 | 437.2 | 0.457 |
| catalog | 0 | html-escaper | 1.799 | 1.779–1.839 | 431.8 | 437.7 | 0.454 |
| catalog | 2 | native | 2.002 | 1.975–2.034 | 506.8 | 509.1 | 4.424 |
| catalog | 2 | wasm | 1.997 | 1.982–2.001 | 513.2 | 517.5 | 6.837 |
| catalog | 2 | escape-html | 2.005 | 1.977–2.066 | 503.8 | 519.8 | 0.814 |
| catalog | 2 | fast-escape-html | 2.006 | 1.964–2.025 | 504.5 | 521.8 | 0.950 |
| catalog | 2 | html-escaper | 2.021 | 2.008–2.051 | 507.5 | 517.9 | 0.897 |
| props | 0 | native | 2.008 | 1.992–2.053 | 459.0 | 466.3 | 3.407 |
| props | 0 | wasm | 2.047 | 2.041–2.069 | 458.7 | 474.5 | 0.953 |
| props | 0 | escape-html | 1.999 | 1.979–2.059 | 451.5 | 459.5 | 0.341 |
| props | 0 | fast-escape-html | 2.009 | 1.993–2.035 | 443.2 | 453.5 | 0.505 |
| props | 0 | html-escaper | 2.138 | 2.090–2.160 | 469.0 | 475.7 | 0.446 |
| props | 2 | native | 2.089 | 2.083–2.144 | 594.7 | 614.3 | 4.471 |
| props | 2 | wasm | 2.100 | 2.079–2.143 | 600.0 | 615.6 | 7.310 |
| props | 2 | escape-html | 2.118 | 2.098–2.141 | 598.1 | 606.5 | 0.881 |
| props | 2 | fast-escape-html | 2.105 | 2.076–2.134 | 597.3 | 607.4 | 0.922 |
| props | 2 | html-escaper | 2.159 | 2.125–2.199 | 610.7 | 625.5 | 0.917 |

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
