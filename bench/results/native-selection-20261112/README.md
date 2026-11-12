# Native selection: retain the existing implementation

Neither proposal met the adoption criteria. `src/native.ts` is byte-identical to
the starting implementation. The public API, declarations and Rust sources are
unchanged. Rebuilding the final native entry produced the exact baseline API
hash recorded in the experiment, with the same local native binary.

- The terminal-match fix reduced its targeted case by 35.60–58.09% across the
  eight CI targets, and 61.33% locally. It nevertheless exceeded +5% on 11 other
  cases on macOS ARM64 and eight on macOS x64 after ten processes. It is rejected
  under the specified all-case regression limit.
- Distribution sampling passed the four-case geometric-mean improvement
  threshold on all eight targets, but violated the regression limit on five.
  Concentration in the head and sampling windows was up to 190.38% worse on
  Linux x64 musl. The combined candidate also failed; it is not adopted.

See the [complete comparison and regressions](comparison.md) and
[machine-readable decision](decision.json). Each table row links to every raw
process sample, including repeats. The local run is in [local.json](local.json).
These are measurements on the recorded hosts, not general performance guarantees.

## Verification and provenance

The fixed baseline is the public native entry at
`eda293bec2bc54e9e77c3d206bebb586bb635087`, frozen in
[`before.ts`](../../native-selection/before.ts). Candidate commit
`67ae2cdc5265ea18122e367bc6b10c503f132653` contains the combined proposal and the
generator for independent baseline, terminal-only, sampling-only and combined
API bundles. All four use the same native binary within each environment.

[Comparison workflow 43219841376](https://github.com/jp-knj/html-escape/actions/runs/43219841376)
passed all 24 correctness combinations: eight native platform packages on
Node 22, 24 and 26. It ran existing native, package and Worker tests, plus the
new routing and UTF-16 boundary tests for every candidate. Node 24 measured
64 cases: the existing 25 plus 39 boundary and distribution cases.

The eight CI targets completed 280 fresh benchmark processes and 17,920 timed
case samples. The local Apple M2 run added 40 processes and 2,560 samples.
All **20,480 samples** are retained. Warmup is at least 100 ms and 10,000 short
or 1,000 long calls, followed by at least 300 ms measurement per case.
`Buffer.byteLength` consumes outputs. Initialization is excluded. Any candidate
above +5% in its initial five processes received five additional processes and
a matching baseline, using the same full fixture sequence.

[`report.mjs`](../../native-selection/report.mjs) independently recomputes the
decision from these process samples. It requires eight distinct CI targets,
identical candidate API bundles, a common CI source commit, matching local
protocol hashes, sufficient warmup/measurement iterations, and the prescribed
five- or ten-process comparisons. Original source hashes are retained even where
Windows checkout line endings differ.

The [artifact provenance](provenance.json) records workflow jobs, artifact IDs
and ZIP digests. Because this workspace could not download artifact URLs, the
[evidence collection workflow](https://github.com/jp-knj/html-escape/actions/runs/43220811627)
read the completed artifacts and exported their measured JSON through logs.
Every local copy was checked against its original SHA-256 before analysis.

Local validation also passed TypeScript, Rust formatting/Clippy, existing unit
and benchmark-harness tests, and native/package/Worker tests on Node 22/24/26
after restoring the final baseline. The [validation directory](validation/)
retains the corresponding logs. See the [reproduction protocol](../../native-selection/README.md).
