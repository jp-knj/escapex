# Native entity-copy evaluation

Results: [all eight targets and 24 correctness environments](../results/tuning-ci-20261110/README.md),
and [local Apple M2 before/after measurements](../results/tuning-local-20261110/README.md).

The candidate derives an eight-unit padded UTF-16 entity table from the shared
Rust replacement table. Each match copies a constant 16 bytes, then advances the
output length by the entity's actual four, five or six units. Reserving the
unvisited input length plus seven units makes the padded store fit even when the
last input unit matches. Padding never becomes part of the returned string.
CPU dispatch, SIMD masks, short-string JavaScript paths, Node-API string
conversion and public exports are unchanged.

The pinned predecessor is `79c0f63ea166dceabebb79279cb3c560cb3c1fc0`.
`prepare-before.mjs` verifies that its JavaScript sources, Cargo manifest and lock
match the candidate, builds its Rust kernel with the same toolchain and baseline
CPU flags, and stages it beside identical generated ESM files. A resolver selects
that complete public API in benchmark children. It is installed for every
implementation, adds no per-call wrapper, and records which native API was loaded.

## Reproduction

Use Node 24, Rust 1.91.1 and the repository's pinned npm dependencies. Build the
current JavaScript, Wasm and native artifacts first. Check out the predecessor
under `target/tuning-baseline` (a separate checkout, not a source replacement).

```sh
node bench/ssg/prepare-before.mjs target/tuning-baseline
mkdir -p target/ssg-tuning/results
COST_VARIANTS=before,native,escape-html,fast-escape-html,html-escaper \
  COST_OUTPUT=target/ssg-tuning/results/cost.json node bench/ssg/cost.mjs
node bench/ssg/tuning.mjs
node bench/ssg/micro.mjs
```

The `Native packed-copy evaluation` workflow runs correctness tests on all eight
platform packages and Node 22/24/26. On Node 24 it also runs these three suites
on native ARM64/x86-64 hardware, with separate glibc and musl targets.

## Distinct measurements

- **Actual-call replay:** untimed Astro builds capture every `escapeHTML` input
  for 1,000 article pages, 250 catalog pages and 64 large-props pages. A separate
  `escape-html` build must produce byte-identical files on that host. Input
  profiles must match `expected-inputs.json`, extracted from the earlier SSG
  fixture. Five independent processes per variant replay each corpus, with at
  least 100 ms warmup and 300 ms measurement. `Buffer.byteLength` consumes each
  output. This estimates warm API costs; it is neither a complete build time nor
  a strict upper bound on cold, allocation or GC costs during an actual build.
- **Complete static builds:** five fresh processes per variant and scenario,
  rotating order through all five positions. Timing includes process startup,
  library import, compilation, rendering and file writes. It excludes package
  installation and subsequent output verification. Every generated file must
  match across all variants and rounds. Astro caches are separate and cleared;
  OS filesystem caches are uncontrolled. This tuning run uses one rendering
  thread, matching the main comparison in the preceding SSG report. Worker
  correctness is tested separately; the earlier two-Worker timings are not
  re-labelled as results for this candidate.
- **Existing 25-case microbenchmarks:** three independent processes per variant,
  using the unchanged competitor worker and fixtures, including minimum warmup
  call counts and output byte-length consumption. This rotation is not fully
  position-balanced with five implementations. All samples and ranges are kept.

Every suite records source and binary SHA-256 hashes. Comparisons are made
within a runner. An API improvement of 5% does not establish a 5% build-time
improvement. For the user-facing SSG goal, the baseline is the fastest median
among `escape-html`, `fast-escape-html` and `html-escaper` for that host and
scenario. The before/after native comparison is reported separately.
