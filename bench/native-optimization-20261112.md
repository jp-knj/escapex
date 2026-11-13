# Native optimization decision (2026-11-12)

Retain the existing JavaScript and Rust implementation. None of the evaluated
changes met the all-case regression limit. Keep regression tests for UTF-16
boundaries, input distributions, Workers and previously returned strings.

| Proposal | Outcome |
| --- | --- |
| Finish terminal matches in JS; add distribution sampling | Targeted improvements, but other inputs exceeded the regression limit. |
| Increase initial Rust output capacity | Regressions on five CI targets; Linux x64 `tail-emoji` was 8.28% slower. |
| Reuse Rust output buffers | Fewer allocations, but the macOS ARM64 text mixed-size case was 7.10% slower. |
| Restrict reuse to HTML | Local attribute cases regressed by 5.39–8.81%; no further matrix timing. |

Performance comparisons used Node 24, at least 100 ms warmup and 300 ms
measurement per case, with `Buffer.byteLength` consuming output. Five fresh
processes were followed by five more when a candidate exceeded +5%; rejection
was based on the final median. The initial suites covered eight native targets
and local hardware. Candidate correctness covered Node 22, 24 and 26.

Raw samples, rejected prototypes, runners and evaluation workflows are retained
on `archive/native-optimization-evidence-20261112` at commit
`61fdbf47fa86e8fd50aae5f1b9b068af57468c12`:

- [Native-selection report and 20,480 samples](https://github.com/jp-knj/escapex/blob/61fdbf47fa86e8fd50aae5f1b9b068af57468c12/bench/results/native-selection-20261112/README.md)
- [Rust buffer report and 15,520 formal samples](https://github.com/jp-knj/escapex/blob/61fdbf47fa86e8fd50aae5f1b9b068af57468c12/bench/results/rust-buffers-20261112/README.md)

These measurements describe the recorded hosts and workloads. Some JS-only
paths varied despite identical bundles; those results do not establish that a
Rust change caused their slowdown. The complete reports retain that distinction.
