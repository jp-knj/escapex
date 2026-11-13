# Comparison with other libraries

These historical measurements use the former name, html-escape, now escapex.
The rename does not change the measured code or conditions below.

This page compares html-escape with escape-html 1.0.3, fast-escape-html 1.1.0
and html-escaper 3.0.3. The measurements come from the commits linked below.
The 0.0.1 release candidate hasn't been benchmarked against these libraries.

## Public API

Measured on an Apple M2 running macOS ARM64 and Node.js 24.22.2 on 2026-11-11.
Each value is the median time in nanoseconds per `escapeHTML` call across five
independent processes. Lower is better. The timer includes native string copies
and reading the output with `Buffer.byteLength`. It excludes imports.
The native entry uses JavaScript for short inputs.

| Input | html-escape native | escape-html | fast-escape-html | html-escaper |
|---|---:|---:|---:|---:|
| Short text (`short`) | 144.0 | 167.0 | 165.7 | 237.9 |
| Unchanged, 16 units (`unchanged-16`) | 39.5 | 43.4 | 40.1 | 66.3 |
| Quoted JSON (`quoted-json`) | 63,793.8 | 189,552.5 | 183,536.3 | 423,915.1 |
| Japanese and emoji (`japanese-emoji`) | 123,680.4 | 430,834.0 | 412,259.6 | 457,888.6 |
| Long body (`long-body`) | 293,219.5 | 887,189.8 | 888,965.4 | 293,003.3 |
| Sparse, 8,192 units (`sparse-8192`) | 4,017.2 | 18,679.1 | 17,451.1 | 4,090.3 |

The table shows six of the 25 cases. Native took more time than html-escaper
on the long body. The unchanged and sparse cases were within 5% of the fastest
competitor. These small gaps in medians don't prove a reliable ranking.
[All 25 cases](results/library-local-20261111/README.md) and
[raw samples](results/library-local-20261111/api.json) include the measurement
conditions and ranges.

The measured library code matches `e093ab74a1b6c63573a9504a14e03482f2c41fe7`.
Across [eight platforms](results/library-ci-20261111/README.md), native had lower
medians than all three competitors in 18 to 24 of the 25 cases per platform.
The later [code cleanup](results/cleanup-20261111/README.md) has local before
and after measurements. That run didn't include competitors.

## Astro builds

The [Astro build benchmark](results/tuning-ci-20261110/README.md) times Node
startup, compilation, rendering and writing HTML files. It uses an earlier
commit, `cf51cdce642d3a45d044d0e5eb61f89dab48319e`.

For pages with large props, native build medians ranged from **4.71% less time
to 9.83% more time** than the fastest competitor on each runner. None of the
eight Node 24 targets met the goal of reducing build time by 5%.

Long pages don't necessarily pass long strings to the escape function. The
[input profiles](results/ssg-ci-20261110/README.md) recorded at most 30 UTF-16
units per call for articles and 49 for catalogs. Check the strings your renderer
escapes and how often it calls the function, then time the whole build,
including startup. Run each library on the same host.

## Run the benchmarks

- [API and Astro Container benchmarks](README.md)
- [Astro builds, memory and Workers](ssg/README.md)

An [earlier comparison of seven implementations](results/competitors-20261110-search/README.md)
also includes ESM, Wasm and `@napi-rs/escape` 1.0.1. It used different commits and
warmup rules. That report describes the differences in supported inputs and
outputs.
