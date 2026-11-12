# Native selection evaluation

`before.ts` freezes the public native entry from
`eda293bec2bc54e9e77c3d206bebb586bb635087`. The experiment changes only
`escapeHTML` selection. Rust, public exports, declarations, the shared JavaScript
core and short/no-match paths remain unchanged.

`prepare.mjs` builds four independent public APIs with the pinned project
bundler: baseline, terminal-match fix, distribution sampling, and both changes.
All four load byte-identical copies of the **same** already-built native addon.
Preparation asserts identical shared JavaScript and declarations and records
source, API and binary hashes. Candidate transformations assert their anchors
occur exactly once. The baseline is never taken from the old library benchmark.

The terminal fix completes JavaScript escaping when the eighth nearby match is
the final UTF-16 code unit. The sampling candidate first honors the existing
eight-match run with start positions at most 16 units apart. An additional run
of eight at most 32 units apart can qualify only for lengths at least 4,096 and
before the exact 25% point. A separate global regexp checks 128-unit slices at
floored 25%, 50% and 75% offsets for at least four target characters each.
It attempts this check at most once per call. Failure never vetoes the existing
native decision or changes the main scanner's position.

```sh
npm run build:all
node bench/native-selection/prepare.mjs
node bench/native-selection/check.mjs
# Run with Node 24, without other CPU-intensive work on the machine:
node bench/native-selection/run.mjs
```

The unchanged competitor worker is redirected to the selected public API and
64 fixtures by a module-resolution hook. The fixtures include all 25 existing
cases, length/gap/count boundaries, concentrated and irregular distributions,
sample-only concentration, Japanese, emoji and lone surrogates. Output equality
is checked outside timing. Each candidate runs in five fresh processes, with
rotated order, at least 100 ms warmup and 10,000 short or 1,000 long calls, and
at least 300 ms per case. `Buffer.byteLength` consumes every timed output.
Initialization is excluded. No per-call benchmark wrapper changes the API.

Any candidate with a case more than 5% above baseline receives five additional
processes, alongside five additional baseline processes. The same full fixture
sequence and warmup rules are retained. A candidate is rejected if any of its
ten-process median ratios still exceeds 1.05. Sampling additionally requires
the geometric mean of the four length 4,096/8,192 by gap 24/32 ratios to be at
most 0.95 **on every platform**. The combined candidate must also pass.
Otherwise, select the terminal fix if it passes, or retain the baseline.

`run.mjs` saves every completed process immediately, including retries, to
`target/native-selection/results/local.json` (override with `SELECTION_OUTPUT`).
The result contains initial and final medians, all raw samples, hashes and
environment metadata. `localSelection` applies only to that host; it is not
cross-platform acceptance.

`check.mjs` runs routing boundary tests with a stub addon and the existing native
and Worker tests against each real candidate API. The dedicated
`native-selection.yml` workflow follows the existing eight-platform matrix,
checks correctness on Node 22/24/26, measures Node 24, and uploads all evidence.
No packages are published by this workflow.
