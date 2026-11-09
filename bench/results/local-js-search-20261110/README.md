# Short-string JavaScript search adoption — local measurements

Apple M2, Darwin 25.5.0, Node 24.22.2. The implementation in source
[6339332](https://github.com/jp-knj/html-escape/commit/633933225dc4aa08a82602b8857a349272016748)
uses a global RegExp.test once, then charCodeAt/switch from lastIndex - 1 for
`escape` / `escapeHTML` inputs shorter than 32 UTF-16 units. Longer inputs
retain repeated regexp searching. The native wrapper reuses this same function
below its separate 256-unit JS/Rust cutoff. Other operations retain their
existing algorithms. The baseline is the frozen ESM code from 7ba356c.

## API timings

Three independent processes per variant, with rotated order, 100 ms warmup
and 200 ms measured time per case. Short inputs also require 10,000 warmup
calls. Every call includes Buffer.byteLength of the output. Values are medians
of three process means, in ns/call. These compare complete public functions,
not just the search loop. Native large-input results include Node-API copies.

| Input | Before ESM | Current ESM | Current native | ESM change |
| --- | ---: | ---: | ---: | ---: |
| given-16 | 196.7 | 154.9 | 150.1 | -21.21% |
| plain-16 | 34.0 | 34.0 | 35.0 | -0.13% |
| first-16 | 96.9 | 107.4 | 105.7 | +10.85% |
| last-16 | 91.2 | 78.1 | 78.4 | -14.38% |
| dense-16 | 437.4 | 216.1 | 210.3 | -50.60% |
| unicode-short | 302.7 | 239.6 | 236.1 | -20.84% |
| first-31 | 105.9 | 152.5 | 152.5 | +43.99% |
| dense-31 | 804.4 | 363.5 | 362.2 | -54.81% |
| first-32 | 107.6 | 108.4 | 109.1 | +0.71% |
| first-64 | 114.8 | 115.4 | 116.6 | +0.53% |
| last-64 | 103.8 | 104.3 | 105.2 | +0.46% |
| plain-255 | 89.4 | 89.4 | 90.9 | +0.05% |
| first-255 | 160.5 | 163.9 | 162.8 | +2.11% |
| dense-255 | 6025.4 | 6094.1 | 6027.5 | +1.14% |
| first-256 | 163.9 | 163.6 | 464.3 | -0.19% |
| plain-8192 | 1516.9 | 1517.7 | 1524.9 | +0.05% |
| sparse-8192 | 1876.1 | 1881.2 | 5057.7 | +0.27% |

The motivating 16-unit example improves by about 21%, and unchanged input
is approximately unchanged. Single-target cases can regress: a leading target
in 16 units takes about 11% more time, and in 31 units about 44% more time.
This is not a universal short-string speedup. The
[discarded 256-unit cutoff](../js-search-256-probe/README.md) produced much larger
sparse-input regressions and is preserved as historical evidence.

## Complete Astro response collection

Astro 7.4.8, three independent processes per scenario, the fixed paired
Williams protocol with eight 500 ms blocks per variant. All four variants
use the same warmed runtime. Each render includes fresh Container creation
and Response.text. Warmup is at least one second and 100 large renders or
10,000 short renders per implementation. All output hashes match.

Absolute times below are descriptive medians in ms/render. The percent change
is the median of within-process current-ESM/before-ESM ratios, not the ratio
of independently selected absolute medians.

| Scenario | Before ESM | Current ESM | Wasm | Native | ESM change |
| --- | ---: | ---: | ---: | ---: | ---: |
| large-props | 12.26493 | 12.13383 | 10.58081 | 8.46107 | -0.28% |
| official-portfolio-hero | 0.05121 | 0.05136 | 0.05154 | 0.05119 | +0.36% |
| official-with-vitest | 0.04895 | 0.04940 | 0.04872 | 0.04952 | +0.46% |

The complete page changes are below 1% in magnitude. This measurement does
not establish a material Astro page speedup from the short-string change.
It is a three-process acceptance check, not a confidence interval.

## Verification and scope

The final 32-unit implementation passed local Node 24 unit tests (ESM/Wasm),
native/Worker tests, actual npm tarball and bundler tests, declarations and
TypeScript checking. Shared correctness fixtures test every UTF-16 value and
alternate 31/32/33-unit, 255/256/257-unit and unchanged calls to catch stale
regexp lastIndex state. Cross-platform CI is recorded separately.

The change adds a dedicated short HTML loop. The shared ESM chunk grows from
2,043 to 2,961 bytes before consumer bundling;
gzip sizes are 887 and 1,067 bytes.
These are chunk sizes, not the size of a tree-shaken consumer application.

Reproduce with `npm run build:all`, `npm run bench:search`, and
`npm ci --prefix bench/astro && npm run bench:astro:search`.

[Raw API data](search-darwin-arm64-node24.json) and
[raw Astro data](astro-search-darwin-arm64-node24.json).
