# ESM context escaping optimization

The context APIs now use packed, context-specific entity tables and consume adjacent escape targets in one character scan. Regexp search skips clean spans. Text waits for an adjacent pair before scanning; attributes wait for a pair separated by at most three unchanged units. Isolated matches stay in regexp search. Primitive-string validation remains at each public entry.

The public output, error messages and existing bundle-size limits are unchanged. The shared UTF-16 test fixture now exercises every code unit immediately after two escape targets, covering both continuation and exit from a run.

Baseline commit: [7e9cfbd](https://github.com/jp-knj/escapex/commit/7e9cfbda9ddaea4dca68adc342eaf8546c3ecfe5). Candidate source SHA-256: 37b26ef5c283c513cc9f3811912582c51da4aabc992cba536caf8c857182ac0c.

Host: Apple M2, darwin arm64, Darwin 25.5.0. Measurements: 2026-11-21T14:49:08.990747+00:00 through 2026-11-21T15:04:02.244669+00:00.

## Protocol

- Keep the existing 28-case context corpus and 25-case HTML control. Each implementation runs in a fresh process with rotated execution order.
- Node 24: six rounds each for before, after and entities 9.0.0. Node 22/26: four rounds each for before and after. HTML control: four rounds on Node 24.
- Per case: at least 100 ms warmup and 10,000 calls below 256 UTF-16 units or 1,000 calls otherwise; explicit GC; at least 300 ms measurement. Consume every output with Buffer.byteLength. Imports and initialization are excluded.
- Report process-mean medians and median before/after ratios paired within the same round. Preserve all samples and minimum/maximum ranges in JSON. Ranges are not confidence intervals.
- Validate every input against the independent oracle before timing. entities is compared only on byte-identical corpus outputs: 28 text cases and 22 attribute cases. Its U+00A0, apostrophe and CR/LF behavior differs from escapex; see [the baseline comparison](../esm-context-baseline-20261121/COMPETITION.md).
- Snapshots, the runtime source and harness are hashed before and after every dataset. Background load and CPU frequency are uncontrolled. These are single-host microbenchmarks, not a cross-platform or full-build speedup claim.

## Results

Times are microseconds per call. Change is the median paired time change; negative means less time. The comparison against entities uses the same measured inputs but does not establish equivalence for arbitrary strings.

### At a glance

| Node | API | dense-255 | quoted-json | short |
|---|---|---:|---:|---:|
| v22.21.1 | escapeText | -14.1% | -11.8% | -1.4% |
| v22.21.1 | escapeAttribute | -51.5% | -7.1% | 4.5% |
| v24.22.2 | escapeText | -10.6% | -4.9% | -2.9% |
| v24.22.2 | escapeAttribute | -52.2% | -12.0% | 2.9% |
| v26.13.0 | escapeText | -12.7% | -3.7% | -8.6% |
| v26.13.0 | escapeAttribute | -47.2% | -5.1% | 4.4% |

- Node v24.22.2 escapeText: after has a lower median than entities in 25/28 comparable cases. Cases at or above entities: unchanged-16 (+0.7%), sparse-8192 (+0.0%), line-endings (+0.3%).
- Node v24.22.2 escapeAttribute: after has a lower median than entities in 21/22 comparable cases. Cases at or above entities: first-16 (+2.1%).

Paired increases above 5%: Node v22.21.1 escapeText/quotes-only: +11.5%, sample ranges do not overlap; Node v22.21.1 escapeAttribute/unchanged-16: +13.8%, sample ranges overlap; Node v22.21.1 escapeAttribute/last-31: +6.4%, sample ranges overlap; Node v22.21.1 escapeAttribute/two-near-31: +15.9%, sample ranges overlap; Node v22.21.1 escapeAttribute/two-far-31: +5.9%, sample ranges overlap; Node v26.13.0 escapeText/mixed-context: +5.3%, sample ranges overlap.

The unchanged HTML control spans -8.4% to +2.7% paired change. Small differences should be interpreted in light of that variation; lower medians do not prove a statistically significant advantage.

### escapeText, Node v22.21.1

| Case | Before | After | Paired change |
|---|---:|---:|---:|
| short | 0.119 | 0.117 | -1.4% |
| unchanged-16 | 0.030 | 0.029 | -1.9% |
| first-16 | 0.077 | 0.074 | -4.1% |
| first-31 | 0.090 | 0.088 | -1.7% |
| first-32 | 0.091 | 0.090 | -1.9% |
| dense-31 | 0.715 | 0.637 | -10.8% |
| unchanged-short | 0.039 | 0.039 | -0.6% |
| unchanged-long | 68.866 | 65.371 | -5.1% |
| quoted-json | 87.664 | 77.469 | -11.8% |
| japanese-emoji | 325.020 | 325.100 | -0.8% |
| long-body | 244.856 | 216.478 | -11.1% |
| dense-quotes | 360.828 | 315.746 | -12.7% |
| first-24 | 0.096 | 0.088 | -7.9% |
| last-31 | 0.094 | 0.095 | 1.6% |
| two-near-31 | 0.115 | 0.119 | 3.0% |
| two-far-31 | 0.117 | 0.119 | 1.8% |
| dense-32 | 0.712 | 0.623 | -13.2% |
| dense-255 | 5.309 | 4.582 | -14.1% |
| first-255 | 0.210 | 0.208 | -1.4% |
| first-256 | 0.207 | 0.208 | 0.3% |
| spaced-8 | 4.910 | 4.867 | -0.7% |
| spaced-32 | 1.584 | 1.555 | -2.3% |
| sparse-8192 | 4.051 | 3.976 | -2.5% |
| mixed-short | 0.285 | 0.293 | 2.1% |
| mixed-long | 25.658 | 23.199 | -9.5% |
| quotes-only | 0.162 | 0.180 | 11.5% |
| line-endings | 0.582 | 0.579 | -0.5% |
| mixed-context | 0.525 | 0.534 | 2.3% |

[Raw samples and ranges](./node22-escapeText.json).

### escapeAttribute, Node v22.21.1

| Case | Before | After | Paired change |
|---|---:|---:|---:|
| short | 0.164 | 0.172 | 4.5% |
| unchanged-16 | 0.030 | 0.034 | 13.8% |
| first-16 | 0.077 | 0.074 | -3.4% |
| first-31 | 0.093 | 0.088 | -5.5% |
| first-32 | 0.091 | 0.090 | -2.9% |
| dense-31 | 0.786 | 0.435 | -45.0% |
| unchanged-short | 0.039 | 0.039 | -0.7% |
| unchanged-long | 65.746 | 65.511 | -0.3% |
| quoted-json | 289.012 | 269.647 | -7.1% |
| japanese-emoji | 512.657 | 511.661 | 0.2% |
| long-body | 229.911 | 230.854 | 1.2% |
| dense-quotes | 689.549 | 336.829 | -50.9% |
| first-24 | 0.088 | 0.089 | 0.3% |
| last-31 | 0.094 | 0.100 | 6.4% |
| two-near-31 | 0.118 | 0.137 | 15.9% |
| two-far-31 | 0.118 | 0.125 | 5.9% |
| dense-32 | 0.796 | 0.455 | -43.7% |
| dense-255 | 5.899 | 2.870 | -51.5% |
| first-255 | 0.214 | 0.211 | -4.0% |
| first-256 | 0.212 | 0.216 | 0.6% |
| spaced-8 | 5.026 | 5.178 | 3.5% |
| spaced-32 | 1.579 | 1.619 | -1.2% |
| sparse-8192 | 4.068 | 4.111 | 1.1% |
| mixed-short | 0.361 | 0.350 | -3.8% |
| mixed-long | 30.012 | 15.901 | -48.4% |
| quotes-only | 5.943 | 2.863 | -51.2% |
| line-endings | 8.768 | 8.312 | -5.5% |
| mixed-context | 1.243 | 0.995 | -18.9% |

[Raw samples and ranges](./node22-escapeAttribute.json).

### escapeText, Node v24.22.2

| Case | Before | After | Paired change | entities |
|---|---:|---:|---:|---:|
| short | 0.145 | 0.141 | -2.9% | 0.154 |
| unchanged-16 | 0.035 | 0.035 | -0.1% | 0.035 |
| first-16 | 0.100 | 0.096 | -2.7% | 0.098 |
| first-31 | 0.104 | 0.104 | -0.6% | 0.104 |
| first-32 | 0.105 | 0.106 | 0.9% | 0.106 |
| dense-31 | 0.712 | 0.648 | -8.9% | 0.737 |
| unchanged-short | 0.041 | 0.040 | -1.5% | 0.055 |
| unchanged-long | 29.004 | 28.922 | -0.4% | 196.969 |
| quoted-json | 77.235 | 73.580 | -4.9% | 80.652 |
| japanese-emoji | 333.587 | 333.478 | 0.1% | 350.806 |
| long-body | 134.733 | 135.055 | 0.5% | 538.137 |
| dense-quotes | 333.379 | 296.974 | -11.0% | 343.459 |
| first-24 | 0.102 | 0.100 | -1.9% | 0.107 |
| last-31 | 0.100 | 0.104 | 3.5% | 0.119 |
| two-near-31 | 0.131 | 0.131 | 0.3% | 0.135 |
| two-far-31 | 0.128 | 0.132 | 2.9% | 0.148 |
| dense-32 | 0.718 | 0.643 | -10.9% | 0.730 |
| dense-255 | 5.141 | 4.592 | -10.6% | 5.261 |
| first-255 | 0.149 | 0.148 | -1.5% | 0.153 |
| first-256 | 0.155 | 0.155 | 0.3% | 0.157 |
| spaced-8 | 4.648 | 4.681 | 0.9% | 4.780 |
| spaced-32 | 1.331 | 1.342 | 0.9% | 1.372 |
| sparse-8192 | 1.853 | 1.867 | 0.6% | 1.867 |
| mixed-short | 0.295 | 0.303 | 2.3% | 0.316 |
| mixed-long | 24.463 | 22.386 | -8.1% | 24.458 |
| quotes-only | 0.080 | 0.080 | 0.2% | 0.085 |
| line-endings | 0.273 | 0.273 | -0.2% | 0.272 |
| mixed-context | 0.534 | 0.540 | 1.1% | 0.551 |

[Raw samples and ranges](./node24-escapeText.json).

### escapeAttribute, Node v24.22.2

| Case | Before | After | Paired change | entities |
|---|---:|---:|---:|---:|
| short | 0.192 | 0.198 | 2.9% | 0.215 |
| unchanged-16 | 0.035 | 0.035 | -0.4% | 0.039 |
| first-16 | 0.100 | 0.099 | -0.5% | 0.097 |
| first-31 | 0.105 | 0.103 | -2.0% | 0.107 |
| first-32 | 0.105 | 0.106 | 0.8% | 0.109 |
| dense-31 | 0.779 | 0.439 | -43.4% | 0.762 |
| unchanged-short | 0.041 | 0.040 | -1.2% | 0.055 |
| unchanged-long | 29.006 | 28.933 | -0.1% | 94.273 |
| quoted-json | 304.169 | 267.907 | -12.0% | 297.737 |
| japanese-emoji | 551.167 | 545.780 | -1.4% | different output |
| long-body | 148.174 | 145.409 | -1.9% | different output |
| dense-quotes | 642.537 | 300.258 | -53.2% | different output |
| first-24 | 0.103 | 0.102 | -2.4% | 0.103 |
| last-31 | 0.101 | 0.105 | 4.0% | 0.116 |
| two-near-31 | 0.131 | 0.130 | -1.2% | 0.133 |
| two-far-31 | 0.128 | 0.132 | 2.2% | 0.144 |
| dense-32 | 0.782 | 0.428 | -45.3% | 0.765 |
| dense-255 | 5.826 | 2.780 | -52.2% | 5.517 |
| first-255 | 0.151 | 0.151 | -0.8% | 0.241 |
| first-256 | 0.154 | 0.158 | 1.1% | 0.242 |
| spaced-8 | 4.691 | 4.731 | 1.2% | 4.996 |
| spaced-32 | 1.346 | 1.359 | 1.0% | 1.680 |
| sparse-8192 | 1.874 | 1.879 | 0.9% | 4.365 |
| mixed-short | 0.364 | 0.351 | -3.8% | 0.397 |
| mixed-long | 26.737 | 13.309 | -50.4% | 27.404 |
| quotes-only | 5.660 | 2.634 | -53.0% | different output |
| line-endings | 8.627 | 7.998 | -7.8% | different output |
| mixed-context | 1.278 | 1.081 | -15.2% | different output |

[Raw samples and ranges](./node24-escapeAttribute.json).

### escapeHTML, Node v24.22.2

| Case | Before | After | Paired change |
|---|---:|---:|---:|
| short | 0.143 | 0.142 | -1.0% |
| unchanged-16 | 0.034 | 0.035 | 2.6% |
| first-16 | 0.102 | 0.105 | 2.7% |
| first-31 | 0.118 | 0.120 | 0.6% |
| first-32 | 0.118 | 0.121 | 1.4% |
| dense-31 | 0.350 | 0.351 | 0.5% |
| unchanged-short | 0.040 | 0.040 | -0.7% |
| unchanged-long | 28.921 | 29.064 | 0.7% |
| quoted-json | 190.101 | 193.688 | 0.9% |
| japanese-emoji | 436.323 | 422.429 | -3.1% |
| long-body | 140.473 | 139.764 | -0.3% |
| dense-quotes | 281.040 | 260.730 | -1.4% |
| first-24 | 0.123 | 0.122 | -1.2% |
| last-31 | 0.082 | 0.082 | 1.1% |
| two-near-31 | 0.137 | 0.139 | -4.6% |
| two-far-31 | 0.140 | 0.136 | -2.4% |
| dense-32 | 0.371 | 0.350 | -4.6% |
| dense-255 | 2.536 | 2.454 | -3.1% |
| first-255 | 0.159 | 0.152 | -3.5% |
| first-256 | 0.167 | 0.161 | -4.9% |
| spaced-8 | 4.505 | 4.409 | -1.0% |
| spaced-32 | 1.481 | 1.361 | -8.4% |
| sparse-8192 | 1.880 | 1.872 | -0.3% |
| mixed-short | 0.290 | 0.288 | -0.1% |
| mixed-long | 12.087 | 12.045 | -0.3% |

[Raw samples and ranges](./node24-escapeHTML.json).

### escapeText, Node v26.13.0

| Case | Before | After | Paired change |
|---|---:|---:|---:|
| short | 0.135 | 0.123 | -8.6% |
| unchanged-16 | 0.029 | 0.028 | -1.0% |
| first-16 | 0.081 | 0.081 | -0.7% |
| first-31 | 0.090 | 0.087 | -3.3% |
| first-32 | 0.090 | 0.089 | -0.9% |
| dense-31 | 0.701 | 0.633 | -9.7% |
| unchanged-short | 0.034 | 0.034 | 0.1% |
| unchanged-long | 12.616 | 12.624 | 0.5% |
| quoted-json | 82.374 | 79.524 | -3.7% |
| japanese-emoji | 266.068 | 273.156 | 1.8% |
| long-body | 69.824 | 69.570 | -1.0% |
| dense-quotes | 339.621 | 300.929 | -11.4% |
| first-24 | 0.095 | 0.092 | -3.4% |
| last-31 | 0.091 | 0.094 | 2.7% |
| two-near-31 | 0.115 | 0.118 | 2.5% |
| two-far-31 | 0.120 | 0.120 | 1.1% |
| dense-32 | 0.699 | 0.622 | -11.3% |
| dense-255 | 5.195 | 4.554 | -12.7% |
| first-255 | 0.114 | 0.109 | -4.2% |
| first-256 | 0.113 | 0.113 | 0.6% |
| spaced-8 | 4.523 | 4.646 | 2.7% |
| spaced-32 | 1.305 | 1.314 | 0.5% |
| sparse-8192 | 0.982 | 1.000 | 2.1% |
| mixed-short | 0.239 | 0.246 | 1.8% |
| mixed-long | 23.958 | 21.327 | -10.4% |
| quotes-only | 0.047 | 0.049 | 0.1% |
| line-endings | 0.132 | 0.134 | 1.7% |
| mixed-context | 0.433 | 0.457 | 5.3% |

[Raw samples and ranges](./node26-escapeText.json).

### escapeAttribute, Node v26.13.0

| Case | Before | After | Paired change |
|---|---:|---:|---:|
| short | 0.169 | 0.176 | 4.4% |
| unchanged-16 | 0.028 | 0.028 | -0.7% |
| first-16 | 0.081 | 0.081 | 0.2% |
| first-31 | 0.091 | 0.088 | -3.0% |
| first-32 | 0.096 | 0.090 | -0.7% |
| dense-31 | 0.795 | 0.462 | -42.0% |
| unchanged-short | 0.034 | 0.033 | -3.2% |
| unchanged-long | 12.986 | 12.639 | -2.6% |
| quoted-json | 292.880 | 278.165 | -5.1% |
| japanese-emoji | 440.790 | 425.184 | -3.8% |
| long-body | 89.796 | 84.927 | -6.0% |
| dense-quotes | 670.410 | 335.041 | -50.0% |
| first-24 | 0.097 | 0.094 | -3.4% |
| last-31 | 0.096 | 0.092 | -3.8% |
| two-near-31 | 0.118 | 0.117 | -0.9% |
| two-far-31 | 0.126 | 0.119 | -4.7% |
| dense-32 | 0.802 | 0.470 | -41.5% |
| dense-255 | 5.840 | 3.078 | -47.2% |
| first-255 | 0.110 | 0.110 | 0.9% |
| first-256 | 0.110 | 0.113 | 2.3% |
| spaced-8 | 4.601 | 4.651 | 2.6% |
| spaced-32 | 1.306 | 1.331 | 3.1% |
| sparse-8192 | 0.980 | 0.991 | 0.9% |
| mixed-short | 0.296 | 0.280 | -5.8% |
| mixed-long | 26.896 | 15.063 | -43.7% |
| quotes-only | 5.730 | 3.015 | -47.3% |
| line-endings | 8.896 | 8.509 | -4.7% |
| mixed-context | 1.055 | 0.875 | -15.7% |

[Raw samples and ranges](./node26-escapeAttribute.json).

## Individual-export bundle sizes

Gzip bytes using the installed package, with host-specific source-path comments removed. Existing limits remain unchanged.

| Bundler | Export | Before | After |
|---|---|---:|---:|
| rolldown | escapeHTML | 582 | 582 |
| rolldown | escapeText | 331 | 322 |
| rolldown | escapeAttribute | 341 | 351 |
| rolldown | unescapeHTML | 241 | 241 |
| vite | escapeHTML | 678 | 678 |
| vite | escapeText | 373 | 369 |
| vite | escapeAttribute | 383 | 399 |
| vite | unescapeHTML | 262 | 262 |

[Raw sizes and bundle hashes](./bundle-sizes.json). HTML and unescape bundles retain their baseline hashes.

## Validation

- npm test passed, including ESM, Wasm, package/bundler, documentation, benchmark and release tests: [log](./tests.log).
- TypeScript, Rust format and Clippy checks passed: [log](./check.log).
- Native build and all 11 native/package tests passed: [log](./native-tests.log).
- ESM tests passed on Node 22 and Node 26: [Node 22](./node22-tests.log), [Node 26](./node26-tests.log).
- Delivered src/escape.ts and the expanded fixture to the original workspace after verifying it had no concurrent edits. Rebuilt there: npm test and all 11 native/package tests passed ([workspace tests](./workspace-tests.log), [native tests](./workspace-native-tests.log)). The delivered ESM files exactly match the measured candidate: [SHA-256 hashes](./workspace-sha256.json).
- Browser validation could not launch Chromium in this sandbox (OS permission failure); browser results are unverified: [log](./browsers.log).

## Reproduce

Install the pinned entities dependency from the baseline directory, preserve both ESM snapshot directories, and run one command at a time. Use the exact Node executables recorded in protocol.json.

```sh
npm ci --prefix bench/results/esm-context-baseline-20261121/competitor-packages --ignore-scripts
COMPARE_VARIANTS=before,after,entities COMPARE_ROUNDS=6 node bench/results/esm-context-optimization-20261121/compare.mjs escapeText
COMPARE_VARIANTS=before,after,entities COMPARE_ROUNDS=6 node bench/results/esm-context-optimization-20261121/compare.mjs escapeAttribute
# Node 22 and Node 26: repeat both commands with before,after and 4 rounds.
COMPARE_VARIANTS=before,after COMPARE_ROUNDS=4 node bench/results/esm-context-optimization-20261121/compare.mjs escapeHTML
node bench/results/esm-context-optimization-20261121/summarize.mjs
```

Candidate selection used shorter exploratory screens before the full acceptance runs. Selection results are not used for the performance claims above.
