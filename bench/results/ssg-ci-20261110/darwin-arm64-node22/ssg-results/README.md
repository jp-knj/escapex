# Full Astro static-build comparison

darwin arm64; Apple M1 (Virtual); Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T13:59:15.752Z. Completed: 2026-11-10T14:04:13.372Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 1.552 | 1.261–2.686 | 294.2 | 299.7 | 1.793 |
| articles | 0 | wasm | 1.677 | 1.391–2.297 | 294.1 | 298.6 | 1.700 |
| articles | 0 | escape-html | 1.791 | 1.523–2.123 | 294.9 | 298.8 | 0.892 |
| articles | 0 | fast-escape-html | 1.722 | 1.481–2.386 | 294.2 | 297.4 | 0.937 |
| articles | 0 | html-escaper | 1.733 | 1.347–2.367 | 296.8 | 299.7 | 1.521 |
| articles | 2 | native | 1.951 | 1.788–2.335 | 395.7 | 397.8 | 3.649 |
| articles | 2 | wasm | 1.855 | 1.734–4.232 | 391.3 | 398.4 | 4.290 |
| articles | 2 | escape-html | 1.823 | 1.672–2.950 | 391.3 | 398.1 | 1.329 |
| articles | 2 | fast-escape-html | 2.032 | 1.654–2.406 | 392.5 | 397.5 | 0.680 |
| articles | 2 | html-escaper | 2.038 | 1.843–2.337 | 389.4 | 395.3 | 0.781 |
| catalog | 0 | native | 1.407 | 1.114–2.080 | 282.6 | 287.4 | 1.774 |
| catalog | 0 | wasm | 1.457 | 1.175–1.520 | 282.0 | 282.9 | 1.933 |
| catalog | 0 | escape-html | 1.353 | 1.215–1.651 | 281.8 | 288.9 | 0.383 |
| catalog | 0 | fast-escape-html | 1.439 | 1.157–1.677 | 282.8 | 285.8 | 0.487 |
| catalog | 0 | html-escaper | 1.323 | 1.221–1.381 | 283.8 | 288.9 | 0.387 |
| catalog | 2 | native | 1.719 | 1.219–1.823 | 348.5 | 358.2 | 3.295 |
| catalog | 2 | wasm | 1.595 | 1.176–1.788 | 347.6 | 354.2 | 3.396 |
| catalog | 2 | escape-html | 1.493 | 1.234–2.383 | 345.4 | 352.5 | 0.559 |
| catalog | 2 | fast-escape-html | 1.809 | 1.446–1.919 | 345.1 | 347.0 | 0.726 |
| catalog | 2 | html-escaper | 1.782 | 1.196–1.944 | 350.4 | 356.1 | 0.753 |
| props | 0 | native | 1.869 | 1.554–2.635 | 338.8 | 349.6 | 1.870 |
| props | 0 | wasm | 2.061 | 1.533–2.321 | 353.9 | 360.8 | 1.919 |
| props | 0 | escape-html | 1.949 | 1.606–2.220 | 320.8 | 326.8 | 0.351 |
| props | 0 | fast-escape-html | 1.875 | 1.748–2.230 | 323.9 | 329.1 | 0.425 |
| props | 0 | html-escaper | 1.847 | 1.653–1.982 | 344.9 | 346.5 | 0.502 |
| props | 2 | native | 1.529 | 1.325–2.156 | 479.1 | 491.8 | 2.659 |
| props | 2 | wasm | 1.440 | 1.378–2.055 | 470.7 | 481.9 | 5.633 |
| props | 2 | escape-html | 1.779 | 1.254–2.110 | 460.1 | 462.7 | 0.528 |
| props | 2 | fast-escape-html | 1.595 | 1.297–2.005 | 460.4 | 466.6 | 0.664 |
| props | 2 | html-escaper | 1.819 | 1.418–2.182 | 484.7 | 491.2 | 0.577 |

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
