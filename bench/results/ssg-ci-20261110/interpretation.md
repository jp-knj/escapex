# What this comparison establishes

Native does not consistently outperform all three JavaScript competitors in
complete static builds. The Node 24 main-thread props fixture improves by up to
4.15% against the fastest competitor across these eight hosted targets; none
reaches a 5% median reduction for that fixture. This is a different comparison
from the original Container-versus-ESM performance gate.

The main-thread Node 24 native changes versus the fastest competitor are:

| Target | Articles | Catalog | Large JSON text |
|---|---:|---:|---:|
| macOS ARM64 | +0.23% | +9.16% | +1.38% |
| macOS x64 | +7.23% | +16.55% | -4.15% |
| Linux glibc ARM64 | +0.63% | -0.97% | -2.71% |
| Linux glibc x64 | +0.81% | +0.12% | -3.19% |
| Linux musl ARM64 | +2.04% | -0.09% | -1.20% |
| Linux musl x64 | -0.15% | +0.68% | +0.45% |
| Windows ARM64 | +3.29% | -0.79% | -3.56% |
| Windows x64 | +0.67% | +0.01% | -0.09% |

Negative means less time. These are ratios of medians from five fresh processes,
not confidence bounds or statistically established regressions. The macOS
hosted runners have particularly wide sample ranges. For example, on macOS ARM64
Node 24 the native catalog samples range from 1.250 to 1.958 seconds; html-escaper
ranges from 1.275 to 1.726 seconds. A median ranking alone cannot identify how
much of that difference comes from the escaping function.

Long JSON text is the most plausible native use case in these fixtures. Native's
Node 24 median was below Wasm's for the props site on all eight targets, though
the samples do not establish an invariant advantage. The separate local Apple
M2 run showed a 7.14% median reduction against the fastest JavaScript competitor
for props; that local result does not generalize to all hosted environments.

Article and catalog pages make short calls: maximum lengths are 30 and 49 UTF-16
units respectively. Article inputs are unchanged in 66.67% of calls. The static
Markdown body is reused without passing its whole text through escapeHTML. The
native API delegates inputs shorter than 128 units to its JavaScript fast path,
so these article and catalog calls do not invoke the Rust SIMD scanner. The
props fixture makes one large call per page, up to 162,559 UTF-16 units. Astro's
own attribute escaping handles the duplicate JSON attribute and is not replaced.

Two Workers increase native props peak RSS by 20.11% to 34.32% on the Node 24
targets. Their wall-time effect varies by site and environment; parallelism is
not an automatic improvement at these fixture sizes. Median main-thread native
API loading for props is 1.620 to 3.958 ms, compared with 0.490 to 1.398 ms for
Wasm. Loading is already included in complete build time.

All 24 environments completed after the documented [Node-version setup
recovery](failures.md). The 3,600 timed builds and 144 diagnostic builds produce
byte-identical static files across implementations, rounds, and Worker counts
within each environment. Input profiles agree across all environments. The
comparison covers generated fixture sites, not a supplied production repository,
and excludes dependency installation and warm incremental builds.

See the [five-library timing tables, memory tables, and all raw samples](README.md).
