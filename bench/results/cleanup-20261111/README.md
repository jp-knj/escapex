# Internal function cleanup

Review found a duplicated HTML entity table and two forwarding helpers that can be simplified without changing the public contract. The final change removes `encodeMatches` by merging its single call site into `encode`, and removes the native `check` helper by routing invalid inputs through the same existing JavaScript functions as short strings. The default and native entries share one HTML entity table. `escapeMatchedHTML` is private to its module; the entity table is not exported by the package entry.

The existing `entityFor` switch is retained. A candidate replacing it with conditional CR/LF handling and table lookup increased the paired ESM quoted-JSON attribute measurement by 4.77% (individual processes: +5.02%, +4.77%, +3.90%). That part was reverted. The final paired median for that case is -0.10%, with wide process variation; this is not a speedup claim.

The short/long HTML scanner separation and CPU-specific Rust functions remain because they serve performance and target-feature boundaries. Rust source, the addon binary, Wasm wrapper/binaries and public declaration files are unchanged. No new generic native dispatcher, wrapper factory or shared validation helper was introduced.

The generated default/native JavaScript (`index.mjs`, `escape-core.mjs`, `native.mjs`) totals 9,436 bytes before and 8,993 bytes after (-4.69%). This is unminified output size, not runtime or memory savings.

## Verification

- Apple M2, macOS ARM64: 22 tests passed on each of Node 22.21.1, 24.22.2 and 26.13.0. Tests cover complete UTF-16 values, isolated surrogates, boundaries, large inputs, exact TypeErrors, all public exports, Workers, npm tarballs, declaration resolution and bundlers.
- TypeScript passed with `--noEmit --noUnusedLocals --noUnusedParameters`.
- Declaration files, Wasm files and the native binary were checked byte for byte against the predecessor.
- The production change is confined to `src/escape-html.ts` and `src/native.ts`. Root README remains `# html-escape`.

This cleanup was verified locally; the preceding [24-environment CI report](../library-ci-20261111/README.md) describes its own earlier source snapshot. No new cross-platform performance claim is made here.

## Paired API measurements

Apple M2, v24.22.2, darwin/arm64; completed 2026-11-11T02:21:31.871Z. Baseline local commit `e41a39e340cb2b6d89b59b40926ebb3107cd9e35` has the production sources tested remotely at `e093ab74a1b6c63573a9504a14e03482f2c41fe7`.

Three fresh processes; both versions loaded in each. Each block consumes output with Buffer.byteLength. Warmup: at least 100 ms and 5,000 short calls or 100 long calls per API/case. Eight 25 ms blocks per API in balanced Williams order. Per-process median block times and before/after ratios are retained.

The initial separate-process measurements varied substantially, so a paired follow-up was added. The paired runs also contain outliers; all blocks, processes and medians are retained. These measurements do not establish absence of regressions or a 5% performance improvement. No static-site builds were timed.

ns/call. The change is the median of three within-process ratios; dividing the displayed medians does not necessarily reproduce it.

| Entry | Case | Operation | Before | After | Paired change |
|---|---|---|---:|---:|---:|
| esm | short | escapeHTML | 167.3 | 164.5 | -1.65% |
| native | short | escapeHTML | 166.8 | 166.1 | -1.95% |
| esm | short | escapeText | 159.4 | 159.8 | +0.06% |
| native | short | escapeText | 160.5 | 160.4 | -0.08% |
| esm | short | escapeAttribute | 208.6 | 207.9 | -0.35% |
| native | short | escapeAttribute | 209.9 | 208.4 | -1.01% |
| esm | short | unescapeHTML | 378.4 | 384.3 | -0.63% |
| native | short | unescapeHTML | 378.0 | 376.6 | -0.72% |
| esm | unchanged | escapeHTML | 49.2 | 51.7 | +5.24% |
| native | unchanged | escapeHTML | 51.9 | 51.7 | -0.29% |
| esm | unchanged | escapeText | 69.7 | 91.9 | +5.89% |
| native | unchanged | escapeText | 80.2 | 69.0 | -13.89% |
| esm | unchanged | escapeAttribute | 61.4 | 60.1 | -2.36% |
| native | unchanged | escapeAttribute | 61.2 | 59.3 | -3.06% |
| esm | unchanged | unescapeHTML | 99.7 | 104.2 | +4.46% |
| native | unchanged | unescapeHTML | 100.9 | 100.7 | -0.17% |
| esm | quoted-json | escapeHTML | 196933.1 | 203850.7 | +3.51% |
| native | quoted-json | escapeHTML | 65745.0 | 65936.3 | +0.29% |
| esm | quoted-json | escapeText | 82936.1 | 82071.1 | -0.36% |
| native | quoted-json | escapeText | 30818.6 | 30143.7 | -2.19% |
| esm | quoted-json | escapeAttribute | 361763.7 | 346478.1 | -0.10% |
| native | quoted-json | escapeAttribute | 70157.5 | 70863.1 | +1.01% |
| esm | quoted-json | unescapeHTML | 817641.1 | 805918.6 | -1.43% |
| native | quoted-json | unescapeHTML | 72053.8 | 69282.3 | -3.85% |
| esm | attribute-newlines | escapeHTML | 552.6 | 541.6 | -1.98% |
| native | attribute-newlines | escapeHTML | 503.5 | 480.5 | -4.56% |
| esm | attribute-newlines | escapeText | 541.0 | 504.9 | -0.18% |
| native | attribute-newlines | escapeText | 512.6 | 549.9 | -0.94% |
| esm | attribute-newlines | escapeAttribute | 822.9 | 1038.9 | +3.48% |
| native | attribute-newlines | escapeAttribute | 796.4 | 1089.5 | +0.37% |
| esm | attribute-newlines | unescapeHTML | 1001.1 | 1037.8 | -0.09% |
| native | attribute-newlines | unescapeHTML | 1018.6 | 1070.3 | +5.07% |

Raw [final paired results](paired.json), [benchmark script](paired.mjs), [baseline hashes](before-source.json) and test logs for [Node 22](tests-node22.log), [Node 24](tests-node24.log), [Node 26](tests-node26.log). The script runs from the repository root after building the predecessor into `target/cleanup-20261111/before-api/` and the final source into `dist/`. Use Node 24 and `node bench/results/cleanup-20261111/paired.mjs`.

The rejected table candidate is retained separately: [HTML comparisons](table-candidate/html.json), [all-operation comparisons](table-candidate/contexts.json), [paired results](table-candidate/paired.json), [runner](table-candidate/measure.py), and [paired runner](table-candidate/paired.mjs). Its source snapshots are under `table-candidate/src/`. These exploratory measurements are not final-source results.
