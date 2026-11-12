# Rust buffer evaluation — 2026-11-12

**Decision: retain the current production Rust and JavaScript implementation.**
The supplied Rust PR notes led to working allocation-reduction prototypes, but
none satisfied the conservative regression gate for the affected public APIs.
The new native regression test verifies that previously returned strings remain
correct after later calls, large/small capacity changes and garbage collection.

## Candidates and outcomes

| Candidate | Allocation result | Reason not adopted |
| --- | --- | --- |
| Initial capacity `2 × input.len()` | Removes one output reallocation. | Confirmed HTML regressions on five CI targets, including Linux x64 glibc `tail-emoji` +8.28% and Windows ARM64 `cluster-tail-9` +8.47%. |
| Reuse output for all three escape functions | After warming the input size, the three Rust probes allocate/reallocate zero output buffers. Retains at most 2 MiB per thread. | macOS ARM64 HTML gate failed; its text mixed-size workload also regressed +7.10% after ten processes per variant. |
| Cache only HTML output | Keeps the same cached HTML buffer and allocates a Vec per text/attribute call. | Local attribute workloads regressed +5.39%, +5.63%, and +8.81% after ten processes per variant. The shared scanner still uses the changed Vec interface. |

All percentages are changes in time per call, using the median of fresh-process
measurements. Positive means slower. A result over +5% in the initial five
processes triggered five more measurements of both that candidate and the
baseline; adoption required the final median to stay within +5% in every case.

The five HTML regressions for full reuse on macOS ARM64 are **JS-only paths**.
Their JS bundle is byte-identical, so these measurements do not establish that
the Rust change slowed those paths. They indicate process/host variability.
The conservative gate was still unmet, and the separate text regression also
prevented adopting full reuse. All raw samples are retained rather than deleting
unfavorable or noisy results.

Reuse did help some workloads. Linux x64 musl reduced `quoted-json` by 45.49%,
`japanese-emoji` by 30.99%, and `dense-quotes` by 53.80%. Local `dense-255`
improved 10.15%. These are individual workload results, not a general speedup.

## Evidence

- [HTML comparison](comparison.md) and [recomputed decision](decision.json):
  64 fixtures, eight CI targets plus the local Mac, 220 fresh processes and
  14,080 timed samples. Both candidates were evaluated independently.
- [Text/attribute comparison](contexts/comparison.md) and
  [decision](contexts/decision.json): 12 fixtures, the same nine environments,
  100 fresh processes and 1,200 timed samples for full reuse.
- [HTML-only follow-up](html-only/contexts/local.json): 12 local context
  fixtures, 20 fresh processes and 240 timed samples. It failed this gate, so
  no eight-target or HTML timing results are claimed for this follow-up.
- [Output allocation probe](validation/allocation.json): excludes Node input
  conversion and the JS string allocation; not a timing benchmark.
- [CI provenance](provenance.json): run/job identifiers, immutable commits and
  SHA-256 checksums of recovered results. Each raw JSON also records source,
  bundle, addon, runtime, target and processor information.
- [Routing classification](routing.json): native call counts obtained by
  substituting a counting addon behind the unchanged public JS bundle.

The formal comparisons contain **340 processes and 15,520 timed samples**.
Performance uses Node 24, at least 100 ms warmup plus the existing minimum call
count, at least 300 ms per case, explicit pre-measurement GC and
`Buffer.byteLength` output consumption. See the
[reproduction instructions](../../rust-buffers/README.md).

The initial candidates passed correctness on all **8 targets × Node 22/24/26**,
including the full UTF-16 range, lone surrogates, boundaries, concurrent Workers,
retained JS results, capacity limits and supported scalar/SIMD implementations.
The HTML-only follow-up passed local Node 22/24/26 checks and Rust tests/clippy.
The permanent native test was also run locally on all three Node versions.

The first CI attempt lacked rustfmt/clippy in musl and converted fixtures to
CRLF on Windows. Dedicated retries corrected the setup without changing the
candidate source. The provenance lists those failed attempts as well as the
successful replacement jobs.

## PR lessons applied

[Oxc #29212](https://github.com/oxc-project/oxc/pull/29212) motivated explicit
buffer ownership and reuse. The prototype moves a Vec out of thread-local
storage and returns it after Node-API copies the output; nested calls never
borrow the same allocation. Its capacity cap avoids retaining an oversized
one-off output.

[Vize #11327](https://github.com/ubugeeei-prod/vize/pull/11327) illustrated why
fewer copies must be evaluated separately from runtime and retained capacity.
The pinned napi `Utf16String` does not expose its owned Vec for transfer, so the
experiment targeted output allocation and kept input conversion fixed.

[Biome #12813](https://github.com/biomejs/biome/pull/12813) informed the benchmark
review: warmup and GC remain outside the timed region, and fresh processes
separate candidates. Those controls reduce but do not eliminate variability.

An additional [owned-Vec pilot](exploratory-owned/owned-pilot.json) used three
processes per variant and 50 ms measurements to inspect a different scanner
signature. Its 384 samples are exploratory, excluded from the formal totals and
adoption decision. Its sources and local correctness logs are preserved in the
same directory; it was not evaluated on the full matrix.
