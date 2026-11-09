# Candidate screens — 2026-11-10

These Apple M2/Node 24.22.2 experiments selected candidates; they are not the final production ranking.
The [final local comparison](../competitors-20261110-adaptive/README.md) and
[real-machine evaluation](../ci-competitive-20261110/README.md) are the production evidence.
All independent process means are retained, including regressions.

## Search and native dispatch

- `probe-initial.json`, `probe-output.json`, `probe-adaptive.json`, `probe-tail.json`, and `probe.json` compare fixed/renewable character windows, clean-run regexp jumps, switch/ASCII-pair classification, array joining and short-tail handling. These search screens, the cutoff screen and the native-dispatch screen use three fresh processes, at least 50 ms warmup (10,000 short calls or 32 long calls), and 100 ms measurement. Each call consumes `Buffer.byteLength`.
- `cutoff-probe.json` compares the bounded scanner at 32, 64, 128 and 256 units. The adopted cutoff is 128. Larger cutoffs made single leading matches less competitive.
- `native-probe.json` compares length, match-spacing and nearby-match-count choices for entering Rust. The adopted HTML path uses a 128-unit minimum and eight consecutive matches separated by fewer than 16 clean units. Short and sparse strings avoid Node-API copies.
- `production-preview.json` is the first 25-case production trial, before the final cutoff/native-dispatch choices and before raising the long-input warmup minimum to 1,000 calls. It is preserved as an intermediate outcome.

Different screens use different worker contexts and warmup policies. Absolute results, especially string-flattening costs on long inputs, can differ substantially between harnesses. Compare variants within a screen. No cross-screen ratio is treated as a controlled improvement estimate.

## Rejected follow-up changes

`table-probe.json` uses three fresh processes, at least 100 ms warmup with 10,000 short or 1,000 long calls, and 200 ms measurement. It compares the adopted implementation against direct, bounded and masked entity-table classification. The direct lookup changes the original short example from about 154 to 163 ns and quoted JSON from 186 to 219 µs. Bounded lookup helps some single-match cases but regresses dense strings and JSON. These changes were not adopted.

`pair-probe.json` uses the same policy and precomputes the 25 possible adjacent target pairs in a 512-slot table. Applying pair grouping to long strings regresses JSON and Unicode. Restricting it to 17–127 units improves dense 31-unit strings, so a built production candidate was checked next.

`paired-version-probe.json` compares that built pair-grouping candidate (`esm` / `native`) with the adopted pre-pair API (`before` / `beforeNative`), plus two rivals. It runs all 25 inputs in three independent processes per implementation, with at least 100 ms warmup, 10,000 short or 1,000 long calls, and 300 ms measurement. The six-implementation order rotates but is not fully balanced in three rounds. Despite the filename, variants run in separate processes; this is not the within-process paired Astro protocol.

The pre-pair API is source 11719c3. Both APIs include output byte-length consumption. Pair grouping passed the existing API/package/type tests plus every possible second UTF-16 unit after a target and all 25 target pairs at boundary positions. It adds 416 bytes to the shared JS build, or 139 gzip bytes, and a 512-slot runtime array. It was rejected because the gains were narrow and single-target/end-target cases regressed. The final production source and build hashes were restored and checked against the pre-pair benchmark.

| Case | Adopted ESM ns | Pair candidate ESM ns | Change |
| --- | ---: | ---: | ---: |
| short | 155.4 | 161.7 | +4.05% |
| first-31 | 129.7 | 133.7 | +3.08% |
| last-31 | 87.3 | 97.5 | +11.74% |
| two-far-31 | 143.0 | 157.7 | +10.26% |
| dense-31 | 376.9 | 336.4 | -10.73% |
| dense-32 | 372.8 | 362.8 | -2.68% |
| mixed-short | 304.8 | 304.0 | -0.26% |
| mixed-long | 12746.6 | 12761.3 | +0.11% |
