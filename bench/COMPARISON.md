# Comparison with other libraries

## Current workspace: HTML escaping

Measured on an Apple M2, macOS ARM64, Node.js 24.22.2 on 2026-11-21.
These are rebuilt current-workspace artifacts. The raw data records source and
binary hashes; it does not identify a published release or infer a commit from
the package version.

Five fresh processes per implementation, with rotated order. Values are median
nanoseconds per `escapeHTML` call, including string conversion and
`Buffer.byteLength` of the result, excluding imports. Lower is better.

| Input | escapex JS | escapex Native | escape-html 1.0.3 | fast-escape-html 1.1.0 | html-escaper 3.0.3 |
|---|---:|---:|---:|---:|---:|
| short | 144.0 | 142.8 | 168.7 | 165.0 | 235.3 |
| unchanged-16 | 39.2 | 39.8 | 44.9 | 40.4 | 65.1 |
| quoted-json | 188,245.9 | 63,824.6 | 197,986.4 | 183,400.2 | 417,982.8 |
| japanese-emoji | 420,719.0 | 122,896.6 | 442,254.3 | 661,993.0 | 456,655.7 |
| long-body | 291,769.0 | 289,248.8 | 779,866.7 | 2,746,589.4 | 290,927.0 |
| sparse-8192 | 4,023.1 | 4,033.7 | 21,067.5 | 52,858.7 | 4,092.2 |

The six rows above are a subset of the unchanged 25-case HTML suite. Short-call
ESM and Native sample ranges overlap (138.7 to 185.9 ns and 139.7 to 202.6 ns).
Quoted JSON favors Native on this host; the default ESM median is above
fast-escape-html for that case. Long-body ranges overlap for ESM, Native and
html-escaper. These measurements do not establish a universal ranking.

[All cases, ranges and protocol](results/current-api-20261121/README.md) and
[raw HTML samples](results/current-api-20261121/escapeHTML.json) retain every run.
See the [reproduction commands](README.md#current-workspace-comparison).

## Current workspace: text and attribute APIs

Three fresh processes per implementation, with the same warmup and output
consumption as the HTML comparison. Median nanoseconds per call are shown.
Only equivalent context APIs are compared; the external competitors above
do not provide these same operations.

| Operation | Input | escapex JS | escapex Native | escapex Wasm |
|---|---|---:|---:|---:|
| escapeText | short | 146.8 | 143.9 | 272.0 |
| escapeText | quoted-json | 76,095.4 | 30,060.4 | 122,156.5 |
| escapeText | sparse-8192 | 1,853.0 | 5,219.3 | 24,145.3 |
| escapeText | line-endings | 271.5 | 277.3 | 272.4 |
| escapeAttribute | short | 196.7 | 194.8 | 316.0 |
| escapeAttribute | quoted-json | 293,346.3 | 63,445.3 | 297,992.9 |
| escapeAttribute | sparse-8192 | 3,993.6 | 5,208.7 | 25,864.7 |
| escapeAttribute | line-endings | 9,061.2 | 2,133.2 | 9,767.6 |

Native benefits the quoted-JSON cases on this host, while the standard JS
entry takes less time for sparse text. The line-ending input is unchanged by
escapeText but expanded by escapeAttribute, so times across operations are
not measurements of equivalent work. The report includes all 28 cases per
operation, their input lengths, ranges and samples.

## Current workspace: Astro input replay

Inputs were captured from fresh ESM builds and the complete generated files
were verified against escape-html: 1,000 article pages, 250 catalog pages and
64 props pages. Six fresh processes per implementation replay each corpus.
Values below are median milliseconds per complete corpus, including output
consumption but excluding imports, compilation and file writes.

| Corpus | Calls | escapex JS | escapex Native | escapex Wasm | escape-html | fast-escape-html | html-escaper |
|---|---:|---:|---:|---:|---:|---:|---:|
| articles | 6000 | 0.501 | 0.504 | 0.959 | 0.538 | 0.524 | 0.826 |
| catalog | 33250 | 8.406 | 8.369 | 13.691 | 8.314 | 8.308 | 9.221 |
| props | 384 | 98.188 | 27.013 | 82.673 | 92.801 | 91.652 | 97.578 |

ESM and Native ranges overlap for articles and catalogs. Props contain long
JSON inputs and favor Native here. Replay is not a full-build benchmark and
cannot predict total build savings. The earlier full-build results below
remain historical evidence.

[Raw replay data](results/current-api-20261121/replay.json),
[build tools](results/current-api-20261121/build.json), and
[serial/two-Worker smoke verification](results/current-api-20261121/ssg-smoke.json)
are retained alongside the [complete report](results/current-api-20261121/README.md).
The smoke run checks three pages per site and is not performance evidence.

## Historical evaluations

These historical measurements use the former name, html-escape, now escapex.
The rename does not change the measured code or conditions below.

This page compares html-escape with escape-html 1.0.3, fast-escape-html 1.1.0
and html-escaper 3.0.3. The measurements come from the commits linked below.
These historical tables are not measurements of the published 0.0.1 archives.

### Public API

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

### Astro builds

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

### Run the benchmarks

- [API and Astro Container benchmarks](README.md)
- [Astro builds, memory and Workers](ssg/README.md)

An [earlier comparison of seven implementations](results/competitors-20261110-search/README.md)
also includes ESM, Wasm and `@napi-rs/escape` 1.0.1. It used different commits and
warmup rules. That report describes the differences in supported inputs and
outputs.
