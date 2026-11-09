# Full Astro static-build comparison

linux arm64; unknown; Node v22.23.4; Astro 7.4.8.

Started: 2026-11-10T13:59:02.014Z. Completed: 2026-11-10T14:04:01.267Z. Source commit: 79c0f63ea166dceabebb79279cb3c560cb3c1fc0.

5 independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.

Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.

All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.

Reproducible synthetic fixtures, not a production-site measurement.

| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |
|---|---:|---|---:|---:|---:|---:|---:|
| articles | 0 | native | 2.043 | 1.986–2.079 | 460.1 | 463.4 | 5.031 |
| articles | 0 | wasm | 2.073 | 2.027–2.128 | 454.6 | 460.0 | 0.964 |
| articles | 0 | escape-html | 2.039 | 2.030–2.062 | 456.4 | 459.6 | 0.386 |
| articles | 0 | fast-escape-html | 2.044 | 1.984–2.074 | 452.4 | 458.9 | 0.515 |
| articles | 0 | html-escaper | 2.022 | 2.011–2.069 | 453.7 | 459.5 | 0.490 |
| articles | 2 | native | 2.227 | 2.174–2.278 | 564.6 | 565.2 | 5.727 |
| articles | 2 | wasm | 2.218 | 2.205–2.229 | 565.5 | 568.4 | 4.550 |
| articles | 2 | escape-html | 2.214 | 2.182–2.246 | 551.4 | 565.9 | 0.648 |
| articles | 2 | fast-escape-html | 2.201 | 2.174–2.231 | 558.6 | 565.2 | 0.823 |
| articles | 2 | html-escaper | 2.204 | 2.195–2.249 | 558.6 | 567.8 | 0.725 |
| catalog | 0 | native | 1.503 | 1.471–1.559 | 445.9 | 454.6 | 4.986 |
| catalog | 0 | wasm | 1.506 | 1.465–1.547 | 444.4 | 448.9 | 0.996 |
| catalog | 0 | escape-html | 1.491 | 1.487–1.514 | 441.4 | 449.3 | 0.366 |
| catalog | 0 | fast-escape-html | 1.480 | 1.477–1.516 | 444.0 | 448.6 | 0.504 |
| catalog | 0 | html-escaper | 1.501 | 1.491–1.511 | 444.6 | 448.3 | 0.455 |
| catalog | 2 | native | 1.680 | 1.656–1.713 | 531.9 | 534.7 | 6.288 |
| catalog | 2 | wasm | 1.672 | 1.660–1.704 | 517.8 | 520.0 | 4.997 |
| catalog | 2 | escape-html | 1.668 | 1.654–1.695 | 521.2 | 528.8 | 0.649 |
| catalog | 2 | fast-escape-html | 1.665 | 1.655–1.680 | 516.4 | 528.0 | 0.801 |
| catalog | 2 | html-escaper | 1.662 | 1.635–1.688 | 515.4 | 523.9 | 0.748 |
| props | 0 | native | 1.580 | 1.538–1.613 | 476.1 | 482.0 | 5.001 |
| props | 0 | wasm | 1.667 | 1.645–1.681 | 478.4 | 497.9 | 0.990 |
| props | 0 | escape-html | 1.626 | 1.591–1.644 | 461.2 | 464.4 | 0.377 |
| props | 0 | fast-escape-html | 1.603 | 1.583–1.626 | 462.7 | 470.8 | 0.525 |
| props | 0 | html-escaper | 1.739 | 1.729–1.791 | 487.6 | 490.7 | 0.449 |
| props | 2 | native | 1.687 | 1.653–1.716 | 634.3 | 636.8 | 5.963 |
| props | 2 | wasm | 1.736 | 1.675–1.756 | 609.7 | 623.0 | 4.696 |
| props | 2 | escape-html | 1.670 | 1.665–1.696 | 608.6 | 620.2 | 0.639 |
| props | 2 | fast-escape-html | 1.672 | 1.644–1.708 | 611.1 | 613.6 | 0.804 |
| props | 2 | html-escaper | 1.712 | 1.704–1.776 | 632.3 | 639.1 | 0.724 |

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
