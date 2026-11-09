# Local native output optimization — 2026-11-10

Apple M2, macOS ARM64, Node.js 24.22.2; Astro 7.4.8. Production code from
`6fa439c`, with the constant-size Rust entity writer. These are three-process
v1 measurements, before the paired aggregation/warmup revision. A fresh
Container is created inside every timed render.

| Scenario | Isolated process native vs ESM | Paired v1 native vs ESM |
| --- | ---: | ---: |
| large-props | -31.07% | -30.86% |
| official-portfolio-hero | -1.13% | +0.17% |
| official-with-vitest | -0.07% | +0.16% |

All criteria pass locally in both protocols. Cross-OS results are recorded
separately; these local results do not replace failed hosted-runner samples.

| Implementation | Cold API import ms | First large render ms | Peak RSS MiB | RSS after GC MiB |
| --- | ---: | ---: | ---: | ---: |
| esm | 0.574 | 44.147 | 356.297 | 328.703 |
| wasm | 0.973 | 40.231 | 393.281 | 343.234 |
| native-scalar | 2.736 | 35.717 | 403.516 | 354.125 |
| native | 2.716 | 34.927 | 405.266 | 353.922 |

Normal Rust exhaustive tests, native Clippy, Node API/package and Worker tests
passed. An optional AddressSanitizer run built successfully but stalled during
runtime initialization before the test harness and was interrupted. No ASan
coverage is claimed.

Raw data: [isolated Astro](astro-darwin-arm64-node24.json),
[paired v1 Astro](astro-paired-darwin-arm64-node24.json),
[microbenchmarks](micro-darwin-arm64-node24.json).
See [methodology](../../README.md) and [other libraries](../competitors-20261110-output/README.md).
