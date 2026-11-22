# Mutation testing: effect of the expanded test suite

StrykerJS 10.1.1 generated the same 438 mutants in `src/escape.ts` and
`src/unescape.ts` for both runs. Only the test suite changed. The comparison
script verifies identical production source and identical mutation locations,
operators, and replacements before comparing outcomes.

| ESM suite | Killed by failing tests | Timed out | Survived | Stryker score | Killed / valid |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before PR #6 | 362 | 11 | 65 | 85.16% | 82.65% |
| After PR #6 | 364 | 12 | 62 | 85.84% | 83.11% |

There were no compilation errors, runtime errors, or uncovered mutants.
Stryker counts timeouts as detected; they are not assertion failures. One
already-detected loop-condition mutant changed from killed to timed out, so
the net killed count rose by two even though three previously surviving
mutants were killed. The timeout difference is not evidence of better tests.

## What improved

PR #6 detected three additional faults: mutants 201, 380, and 387 replaced the
error messages of `escapeHTML`, `escapeText`, and `escapeAttribute` with empty
strings. The exact-message assertions caught all three. The expanded input
enumeration and boundary cases did not kill additional mutants in this
generated set. This is a measured result for these operators, not evidence
that the additional inputs are useless or that all possible bugs are covered.

Mutation testing also found a remaining contract gap: mutant 440 replaced
the decoder's error message with an empty string. PR #7 adds the corresponding
assertions for both `unescape` and `unescapeHTML`, including coercion-sensitive
objects and successful calls after rejection. Subsequent reports are uploaded
by the PR's mutation workflow.

## Review of surviving escape mutants

The other 61 survivors affect search strategy or operations that preserve
output under the primitive-string contract. The following groups cover all
61; exact replacements and locations are in `comparison.json`.

| Source locations in `src/escape.ts` | Review |
| --- | --- |
| Lines 41, 45 | Select different correct short/long scanning paths. |
| Lines 49, 65, 86, 96, 104, 137 | Append an empty slice when `last === index`. |
| Lines 58–59 | Change when scanning returns to the regular expression, or disable that optimization. |
| Lines 70, 90, 109 | Append an empty suffix instead of returning `output` directly. |
| Lines 81–83 | Choose different scanning paths; an extra end-of-input iteration is rejected by the character guard. |
| Lines 92–93, 99, 101 | Change the scan window or defer an end check; out-of-range characters do not match and the regexp resumes from the same position. |
| Lines 136, 140 | Change when runs are scanned instead of searched; the entity lookup still stops at non-target characters or end of input. |

This is a source review, not a formal proof of equivalence. No survivors are
suppressed, and no tests assert private tuning thresholds merely to improve
the score. Speed regressions need benchmarks; functional mutation testing
does not establish a performance ranking.

## Reproduce and inspect

```sh
npm ci
npm run test:mutation
npm run --silent test:mutation:summary
node test/mutation/summarize.mjs bench/results/mutation-20261122/expanded.json bench/results/mutation-20261122/before.json
```

Use Node 24.11 or newer. The historical comparison ran on Ubuntu 24.04 with
Node 24, four Stryker workers, and a 10-second additional timeout. The command
runner rebuilds the mutated source and runs `test/escape-html.test.mjs` for
each mutant. It does not mutate Rust, native loading, or Wasm wrappers.

The [comparison workflow](https://github.com/jp-knj/escapex/actions/runs/45017604535)
has the full HTML and JSON reports in `mutation-before-pr-6` and
`mutation-current`. These checked-in compact reports retain every mutant's
ID, operator, location, replacement, status, and original source; runner logs
and HTML assets are omitted. `provenance.json` records test/tool commits and
SHA-256 hashes of the full JSON reports. Artifacts have limited retention;
the compact reports preserve the evidence needed to recompute this table.

To repeat the historical baseline with the same tools, restore only these
tests from `fd31b9def97ccdabb51811f2747a53919c2fda51` in a disposable checkout,
then run Stryker: `test/escape-html.test.mjs`, `test/fixtures/wasm-check.mjs`,
and `test/fixtures/unescape-check.mjs`. The expanded suite comes from
`809bbdb6d9c9633b317310d8986d0a654b78f819`.
