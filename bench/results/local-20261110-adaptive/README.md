# Local adaptive native evaluation — 2026-11-10

Apple M2, macOS ARM64, Node.js 24.22.2; Astro 7.4.8. Source implementation
`ac371f4`. These runs use a fresh Container per render, including its creation
in the timed region. Each scenario has three independent runs in each protocol.

| Scenario | Isolated process native vs ESM | Paired process native vs ESM |
| --- | ---: | ---: |
| large-props | -28.43% | -28.91% |
| official-portfolio-hero | -1.05% | -1.07% |
| official-with-vitest | +0.41% | -1.69% |

All three thresholds pass in both protocols on this host. This does not
establish the result for other OSes or CPUs; see the separate CI evidence.

| Implementation | Cold API import ms | First large render ms | Peak RSS MiB | RSS after GC MiB |
| --- | ---: | ---: | ---: | ---: |
| esm | 0.534 | 44.690 | 356.453 | 328.656 |
| wasm | 1.043 | 40.503 | 392.875 | 342.844 |
| native-scalar | 2.865 | 36.587 | 399.094 | 349.750 |
| native | 2.714 | 35.616 | 405.438 | 355.125 |

Raw data: [isolated Astro](astro-darwin-arm64-node24.json),
[paired Astro](astro-paired-darwin-arm64-node24.json),
[microbenchmarks](micro-darwin-arm64-node24.json).
All blocks, process means, startup timings, memory samples and hashes are kept.
See [methodology](../../README.md) and [other library comparison](../competitors-20261110/README.md).
