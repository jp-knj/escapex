# Native SIMD and output-reservation experiments

Decision: retain the production implementation. This branch preserves rejected
prototypes, verification runners and their measurements; no production PR was
opened for these changes. No YAML files were added or modified.

| Proposal | Result |
| --- | --- |
| Pair SIMD character comparisons with bitwise OR | Local public-API timings showed no meaningful improvement after ten samples. |
| Reserve once per vector for all escape modes | Local text escaping regressed by 15.88% at 256 units and 17.49% at 8,192 units after ten samples. |
| Reserve once per vector only for HTML | Passed the local 82-case screen, but failed the regression limit on five CI targets. |

The HTML-only proposal reduced the local all-target input time by 11.86% at
256 UTF-16 units and 15.33% at 8,192 units. In CI, Linux x64/musl `spaced-8`
regressed by 11.61% and Windows ARM64 `cluster-tail-9` by 24.03%, after ten
samples. Some JS-only paths varied despite identical bundles; those results
do not establish that Rust caused their slowdown.

Public API measurements used Node 24, at least 100 ms warmup plus the existing
minimum iteration count, at least 300 ms measurement, pre-measurement GC, and
`Buffer.byteLength` consumption. Five fresh processes per variant and suite
were followed by five more whenever a case exceeded +5%. The corpus contains
66 HTML and 16 text/attribute cases. The earlier comparison-classifier screen
used 64 HTML and 12 text/attribute cases. Rust-only pilot timings are separate:
three processes per variant, 20 ms warmup and 100 ms measurement with `black_box`.

The existing Rust, native API, Worker and package correctness checks passed on
all eight targets with Node 22, 24 and 26. The first CI run's Windows timing
steps failed because `--import` needed a file URL. The retry fixed that runner
argument, kept the Rust proposal unchanged, and collected both Windows targets.

- [Initial CI run](https://github.com/jp-knj/html-escape/actions/runs/43248378661)
- [Windows retry and correctness matrix](https://github.com/jp-knj/html-escape/actions/runs/43355391195)
- [Per-platform decision and regressions](summary.json)
- [All measurements, source snapshots and local runners](all-evidence.json.gz)
- [Archive counts and SHA-256 checksums](manifest.json)

The gzip JSON contains 360 formal processes / 14,640 measurements, plus 12
Rust-only pilot processes / 216 measurements. CI payload checksums were
verified before archiving. The baseline implementation is commit
`eda293bec2bc54e9e77c3d206bebb586bb635087`, unchanged in main commit
`93c7511b8c6901d976a7ad89f50c0d45c48d9fe7`.
