# Benchmarks

The [comparison with other libraries](COMPARISON.md) covers API timings and
Astro build times, with links to the samples.

The latest [internal function cleanup](results/cleanup-20261111/README.md) shares
the HTML entity table and removes two forwarding helpers. Its local validation
covers all public APIs and records the candidate rejected during measurement.

The preceding performance change targets html-escape's short-string implementation. See
the [library-only protocol](library/README.md), [local comparison](results/library-local-20261111/README.md)
and [eight-target API evaluation](results/library-ci-20261111/README.md). Those
measurements compare native and default ESM entries with their predecessor and
do not estimate a static-site build improvement.

For the complete static-site build comparison against three competing libraries,
use [`npm run bench:ssg`](ssg/README.md). This includes Node startup, compilation,
HTML file writes, input profiles, peak RSS, and two-Worker rendering. The
Container benchmarks below measure a different scope.

Recorded full-build comparisons: [local Apple M2](results/ssg-local-20261110/interpretation.md)
and the [native target matrix](results/ssg-ci-20261110/README.md). The latter keeps
every sample, including environments without a native speed advantage.

Build all implementations first. Astro 7.4.8 requires Node >=22.23.4; use a
current Node 24 or 26 for the benchmark suite.

```sh
npm run build:all
npm run build:native:scalar
npm run bench
npm ci --prefix bench/astro
npm run bench:astro
npm run bench:astro:paired
```

The scalar build writes `target/native-scalar-api/` and does not replace the
production addon. `BENCH_ROUNDS` defaults to 3 for micro/isolated measurements
and 9 for paired rendering, and must be at least 3. Every
implementation and Astro scenario runs in a fresh process per round in the
original `bench:astro` protocol. The paired protocol below uses one fresh
process per scenario and round, containing all four implementations. The
execution order rotates between rounds. Avoid other intensive workloads while
measuring. JSON results go to `target/bench-results/`, including raw samples,
runtime versions, CPU, architecture, cold import timings, RSS, heap/external
memory snapshots and process peak RSS. Committed results are in `results/`.
The current [eight-target evaluation](results/ci-competitive-20261110/README.md)
includes all raw samples, successes and failures for both Astro protocols.

The Native workflow runs these measurements on Node 24 for `verify/native-*`
branches, or when a manual run enables `benchmarks`. Its evidence artifacts
include the runner environment, Rust's list of tested SIMD implementations,
the source commit and the workflow URL. Compare variants within one runner;
absolute times across hosted runner types are not a hardware-controlled
comparison.

## Microbenchmarks

`npm run bench:search` measures the short-string JavaScript search change on
Node 22/24/26. It compares the ESM implementation retained from `7ba356c` with
the current ESM and native public APIs, in three independent processes per
variant by default. The suite includes unchanged strings, one/many matches,
Unicode, the 31/32- and 255/256-unit boundaries, and sparse long inputs. Every call includes
`Buffer.byteLength`; all samples and regressions are saved under
`target/bench-results/search-*.json`. CI runs it on every native target/Node
combination. It is an API comparison, not an Astro render-time estimate.
`npm run bench:astro:search` separately compares the retained ESM function with
the current ESM/Wasm/native APIs in the fixed paired Astro protocol, with three
independent processes per scenario. Its before/after statistic keeps each
process paired and includes fresh Container creation and complete HTML collection.
The [earlier local adoption report](results/local-js-search-20261110/README.md)
records the preceding 32-unit cutoff, its improvements and its single-target regressions.

Short strings, unchanged strings, quoted JSON, Japanese/emoji, long sparse
markup and dense quotes are measured for all four operations. Every measured
call includes `Buffer.byteLength(result)` to consume the output and flatten
ESM string ropes. Values are nanoseconds per call, not Rust-only kernel time.
Each case warms for 30 ms and measures for at least 150 ms. Output equivalence
is asserted before timing. ESM, optimized Wasm, native scalar and native SIMD
all include their public wrappers and string conversion costs. Wasm's scalar
variant remains covered by correctness tests.

## Astro

Fixtures are compiled once before measurement with the pinned Astro compiler.
The worker installs a Node module load hook that substitutes only Astro's
`escapeHTML` export; other exports come from the original runtime. This hook
is asserted to run once. No installed Astro file is changed. All variants,
including the ESM baseline, use the same hook. Wasm initialization is awaited
before importing Astro.

Each timed render creates a fresh `AstroContainer`, then includes
`renderToResponse()` followed by `Response.text()`, so container creation,
JSON serialization, escaping, native/Wasm string copies,
stream assembly and HTML decoding are included. This is in-process SSR plus
complete HTML collection; it does not include an HTTP server or network
latency. The scenario warms for at least 400 ms and measures for at least
1,200 ms. First API import, first Astro runtime import and first complete
render are recorded separately. SHA-256 hashes must match across all variants
and rounds for each scenario.

- `large-props`: 4,096 records with Japanese, emoji, quotes and HTML. The page
  serializes the props to JSON and renders it into an attribute and a text
  node. This is a synthetic stress case, not a client framework hydration
  benchmark.
- `official-portfolio-hero`: the official Hero component with short title and
  tagline props containing HTML characters. Component CSS is inlined by the
  compiler so no Vite asset server is required.
- `official-with-vitest`: the official page, primarily static markup with the
  short `Astro.generator` attribute.

The two official fixtures are copied unchanged from withastro/astro commit
`5f4d759d1f26d4f9dad52ed8351127ea9105406d`:
[Hero.astro](https://github.com/withastro/astro/blob/5f4d759d1f26d4f9dad52ed8351127ea9105406d/examples/portfolio/src/components/Hero.astro)
and [index.astro](https://github.com/withastro/astro/blob/5f4d759d1f26d4f9dad52ed8351127ea9105406d/examples/with-vitest/src/pages/index.astro).
They are MIT licensed, copyright Fred K. Schott; the repository LICENSE
includes this attribution.

The reported value is the median of independent process means. The evaluation
requires at least 5% lower total time for `large-props` and no more than 5%
higher time for each official example. ARM64 and x86-64 must be evaluated
separately; one does not establish the result for the other. Three runs are
a basic acceptance check, not a statistical confidence interval. API cold
import and memory figures are reported, not included in the steady-render
threshold. Peak RSS is process-wide, not an allocation count.

## Paired steady-render comparison

The initial benchmark reused one Astro Container. In pinned Astro 7.4.8,
`renderToResponse()` appends a route to that container's manifest on every call.
Repeated renders therefore measured a growing route table. The corrected
benchmark creates a fresh container for every render using the public API;
creation time is included equally for all implementations. Earlier measurements
are preserved as historical evidence but cannot establish steady render costs.

The initial hosted-runner measurements also varied substantially between processes:
for example, the macOS ARM64 ESM with-vitest samples were 97.48, 81.89 and
181.44 microseconds. This variation is much larger than the 5% short-example
allowance, even though that example passes only an unchanged short string to
the escaping function. The isolated-process protocol remains available and
continues to record cold imports, first renders and memory.

`bench:astro:paired` compares steady rendering with a shared warmed Astro
runtime. Every variant uses the same forwarding function to select its actual
public `escapeHTML`; this does not bypass the native wrapper. The fixture and
props are shared with the isolated-process protocol. Hashes must match before
timing and across all independent processes for each scenario.

The original paired protocol used three independent processes and divided the
median native time by the median ESM time. That can select samples from different
processes and lose the pairing. For example, ESM times of 70, 75, 84 and native
times of 69, 80, 86 give +6.67% from independent medians, while the median of
within-process changes is +2.38%. The v2 protocol keeps the baseline paired and
uses nine independent processes to better characterize runner variation. The
older three-process results and their failures remain recorded.

The v2 protocol is fixed before collecting its follow-up CI results:

- Nine independent processes for each of the three scenarios by default.
- At least one second of warmup per implementation in each process, and at
  least 100 large renders or 10,000 short renders. Time-only warmup runs fewer
  calls on slow hosts, so it can leave implementations at different JIT tiers.
  Actual warmup counts and times are recorded.
- Eight cycles of four 500 ms blocks. A balanced Williams order gives each
  implementation every position and every preceding implementation equally.
- The median of eight block means is recorded per implementation and process.
  Each process's native/ESM time ratio is calculated before taking the median
  across processes. Absolute time medians remain descriptive; dividing them
  does not reproduce this paired estimate. All blocks and ratios are saved.
- The same thresholds apply: large props at most -5%, each official example at
  most +5%, measured against ESM on that runner. A failed paired threshold makes
  this command fail **after** saving JSON; it is not silently treated as success.

This reduces differences from separate JIT warmups and changing host load. It
does not remove all VM scheduling or GC variation, provide a confidence interval,
or establish startup performance. Loading all implementations in one process
makes paired memory unsuitable for per-implementation comparisons; use the
isolated-process results for those. Both protocols are retained in CI evidence,
including any failures. A pass in one is not reported as a pass in the other.

## Relation to ox-content

The comparison source is
[ox-content's nibble scanner at a7bb244](https://github.com/ubugeeei-prod/ox-content/blob/a7bb2442b02697be34355fb65052a71bc5e4814d/crates/ox_content_renderer/src/html/escape/nibble.rs).
It classifies UTF-8 bytes with nibble lookup tables using NEON or SSSE3,
returning the first matching position. This implementation compares UTF-16
code units using NEON, SSE2 or AVX2 and consumes every match from each vector.
The classifiers are independently implemented; no nibble-table code is copied.

These measurements do not benchmark ox-content and do not establish a speedup
over it. A fair direct comparison must distinguish UTF-8 bytes from UTF-16
units, account for surrogate preservation, compare equivalent escape rules,
and state whether Node-API transfers and complete output collection are timed.
Native SIMD here is an explicit API option; it is not a claim that all input
shapes are faster than ESM.

## Other libraries

The preceding native kernel change is evaluated in the
[packed-copy report](results/tuning-ci-20261110/README.md), with a pinned native
predecessor, the existing 25 cases, actual SSG call replay and complete static
builds. See its [reproduction protocol](ssg/TUNING.md). The all-environment 5%
full-build goal remains unmet. The adaptive-search reports below describe the
preceding implementation.

```sh
npm ci --prefix bench/competitors --ignore-scripts
node bench/competitors/run.mjs
```

This separate suite compares the public string APIs of this package's ESM,
Wasm and native entries, `escape-html`, `fast-escape-html`, `html-escaper`, and
`@napi-rs/escape`. It pins versions, checks equivalent HTML before timing,
records lone-surrogate, entity-spelling and non-string input differences, and
consumes every output with `Buffer.byteLength`. By default each implementation
runs in seven independent processes, rotating through every execution position
once. `BENCH_ROUNDS` can override that count (minimum three). Warmup requires
100 ms and at least 10,000 calls for inputs below 256 UTF-16 units (1,000 calls
otherwise); measured time is at least 300 ms per case. Initialization is excluded.
The suite includes 25 cases: the original 12-case comparison and 13 additional
position, spacing, length and changing-input cases. `BENCH_VARIANTS` can select
a comma-separated subset. The targeted comparison uses
`esm,native,escape-html,fast-escape-html,html-escaper`. Each changing-input pool
rotates strings on every call; metadata records its size and input-length range. Medians, ranges and all samples
are retained. See the current
[five-round local comparison](results/competitors-20261110-adaptive/README.md)
and [real-machine comparison](results/ci-competitive-20261110/README.md).
The [comparison before adaptive search](results/competitors-20261110-search/README.md)
used the earlier warmup policy and remains historical evidence.
The Native workflow records the current targeted comparison on all 24 target/Node
combinations for verification branches or manually enabled benchmarks.
Each CI combination uses three independent processes per implementation; this
rotates the five implementations without fully balancing all positions.
These are public API measurements. Use the separate Astro suite for render
times, and compare implementations within a host rather than absolute times
across different hosted runners.
The [earlier output-optimization comparison](results/competitors-20261110-output/README.md)
remains available as historical evidence.
