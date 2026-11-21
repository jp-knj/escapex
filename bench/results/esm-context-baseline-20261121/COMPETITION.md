# Competitor baseline

Source: 7e9cfbda9ddaea4dca68adc342eaf8546c3ecfe5. Host: Apple M2, darwin arm64, Node v24.22.2, V8 13.6.233.17-node.63.

This is a baseline before optimization. It does not establish universal fastest status. Medians rank only the measured corpus on this host and runtime; close or overlapping ranges need more paired evidence.

## Comparison rules

- Keep all existing input cases. Measure every implementation in fresh processes, with balanced execution order. Include Buffer.byteLength of each output, excluding imports and initialization.
- HTML: escapex ESM, escape-html 1.0.3, fast-escape-html 1.1.0 and html-escaper 3.0.3; four rounds per implementation across 25 cases. The existing harness validates output before timing.
- Context APIs: compare the saved escapex ESM artifact with entities 9.0.0, six rounds per implementation in alternating order. Only include a case when every input in its pool produces byte-identical output. No adaptation or normalization is included in timing.
- The entities context APIs are not interchangeable with escapex for arbitrary input. entities escapes U+00A0; its attribute API leaves apostrophes and CR/LF unchanged. This is verified by checking every UTF-16 code unit and by validating the corpus. API source: [entities 9.0.0](https://github.com/fb55/entities/blob/v9.0.0/src/escape.ts).
- All reported numbers are medians of independent process means. Minimum/maximum ranges and every individual sample are retained in the JSON. Ranges are not confidence intervals.
- The compared libraries may accept different non-string inputs. Timed inputs here are primitive strings.

| API | Matched cases | Cases with lower escapex median than every compared library |
|---|---:|---:|
| escapeHTML | 25 | 21 |
| escapeText | 28 | 25 |
| escapeAttribute | 22 | 14 |

Case counts are descriptive, with no application-frequency weighting; they are not an overall performance score.

## escapeHTML

All 25 HTML cases are included.

Times are microseconds per call. Ratio is escapex median divided by the lowest competitor median; below 1 favors escapex.

| Case | esm | escape-html | fast-escape-html | html-escaper | Ratio |
|---|---:|---:|---:|---:|---:|
| short | 0.147 | 0.169 | 0.170 | 0.237 | 0.865 |
| unchanged-16 | 0.039 | 0.046 | 0.040 | 0.066 | 0.963 |
| first-16 | 0.106 | 0.124 | 0.114 | 0.129 | 0.938 |
| first-31 | 0.127 | 0.178 | 0.164 | 0.140 | 0.907 |
| first-32 | 0.127 | 0.182 | 0.168 | 0.141 | 0.895 |
| dense-31 | 0.350 | 0.382 | 0.390 | 0.936 | 0.916 |
| unchanged-short | 0.053 | 0.059 | 0.055 | 0.084 | 0.969 |
| unchanged-long | 93.932 | 93.997 | 93.975 | 94.357 | 1.000 |
| quoted-json | 189.216 | 198.657 | 183.298 | 418.347 | 1.032 |
| japanese-emoji | 422.131 | 441.103 | 667.924 | 458.232 | 0.957 |
| long-body | 293.001 | 787.172 | 2756.586 | 291.941 | 1.004 |
| dense-quotes | 261.842 | 256.742 | 393.840 | 669.923 | 1.020 |
| first-24 | 0.127 | 0.168 | 0.278 | 0.141 | 0.895 |
| last-31 | 0.095 | 0.115 | 0.117 | 0.145 | 0.825 |
| two-near-31 | 0.146 | 0.196 | 0.314 | 0.175 | 0.833 |
| two-far-31 | 0.146 | 0.190 | 0.310 | 0.179 | 0.813 |
| dense-32 | 0.361 | 0.369 | 0.486 | 0.986 | 0.978 |
| dense-255 | 2.485 | 2.440 | 3.449 | 6.929 | 1.019 |
| first-255 | 0.243 | 0.753 | 1.824 | 0.270 | 0.900 |
| first-256 | 0.235 | 0.751 | 1.774 | 0.275 | 0.855 |
| spaced-8 | 4.396 | 5.022 | 9.537 | 5.213 | 0.875 |
| spaced-32 | 1.623 | 3.358 | 7.489 | 1.794 | 0.905 |
| sparse-8192 | 4.043 | 21.051 | 53.906 | 4.106 | 0.985 |
| mixed-short | 0.312 | 0.354 | 0.475 | 0.424 | 0.881 |
| mixed-long | 13.697 | 18.927 | 36.291 | 35.416 | 0.724 |

Raw process samples, ranges, source hashes and metadata: [node24-competitors-escapeHTML.json](./node24-competitors-escapeHTML.json).

## escapeText

Included 28 of 28 cases. Excluded because outputs differ: none.

Times are microseconds per call. Ratio is escapex median divided by the lowest competitor median; below 1 favors escapex.

| Case | esm | entities | Ratio |
|---|---:|---:|---:|
| short | 0.145 | 0.161 | 0.895 |
| unchanged-16 | 0.034 | 0.034 | 0.991 |
| first-16 | 0.099 | 0.101 | 0.986 |
| first-31 | 0.101 | 0.102 | 0.990 |
| first-32 | 0.102 | 0.103 | 0.988 |
| dense-31 | 0.636 | 0.656 | 0.971 |
| unchanged-short | 0.043 | 0.058 | 0.741 |
| unchanged-long | 28.765 | 194.971 | 0.148 |
| quoted-json | 76.465 | 80.105 | 0.955 |
| japanese-emoji | 301.092 | 323.321 | 0.931 |
| long-body | 132.284 | 534.458 | 0.248 |
| dense-quotes | 332.278 | 344.317 | 0.965 |
| first-24 | 0.105 | 0.111 | 0.951 |
| last-31 | 0.102 | 0.122 | 0.837 |
| two-near-31 | 0.133 | 0.140 | 0.947 |
| two-far-31 | 0.128 | 0.150 | 0.856 |
| dense-32 | 0.720 | 0.724 | 0.994 |
| dense-255 | 5.132 | 5.191 | 0.988 |
| first-255 | 0.150 | 0.158 | 0.947 |
| first-256 | 0.158 | 0.160 | 0.988 |
| spaced-8 | 4.642 | 4.766 | 0.974 |
| spaced-32 | 1.340 | 1.369 | 0.979 |
| sparse-8192 | 1.864 | 1.861 | 1.002 |
| mixed-short | 0.297 | 0.314 | 0.945 |
| mixed-long | 24.761 | 24.375 | 1.016 |
| quotes-only | 0.081 | 0.085 | 0.954 |
| line-endings | 0.272 | 0.269 | 1.011 |
| mixed-context | 0.528 | 0.547 | 0.966 |

Raw process samples, ranges, source hashes and metadata: [node24-entities-escapeText.json](./node24-entities-escapeText.json).

## escapeAttribute

Included 22 of 28 cases. Excluded because outputs differ: japanese-emoji, long-body, dense-quotes, quotes-only, line-endings, mixed-context.

Times are microseconds per call. Ratio is escapex median divided by the lowest competitor median; below 1 favors escapex.

| Case | esm | entities | Ratio |
|---|---:|---:|---:|
| short | 0.193 | 0.210 | 0.915 |
| unchanged-16 | 0.034 | 0.038 | 0.893 |
| first-16 | 0.101 | 0.097 | 1.039 |
| first-31 | 0.103 | 0.103 | 1.007 |
| first-32 | 0.104 | 0.105 | 0.984 |
| dense-31 | 0.736 | 0.701 | 1.050 |
| unchanged-short | 0.044 | 0.056 | 0.790 |
| unchanged-long | 29.037 | 94.080 | 0.309 |
| quoted-json | 304.334 | 295.912 | 1.028 |
| first-24 | 0.109 | 0.104 | 1.048 |
| last-31 | 0.106 | 0.116 | 0.917 |
| two-near-31 | 0.141 | 0.131 | 1.070 |
| two-far-31 | 0.135 | 0.146 | 0.923 |
| dense-32 | 0.795 | 0.759 | 1.048 |
| dense-255 | 5.768 | 5.499 | 1.049 |
| first-255 | 0.159 | 0.237 | 0.668 |
| first-256 | 0.152 | 0.237 | 0.640 |
| spaced-8 | 4.658 | 4.980 | 0.935 |
| spaced-32 | 1.332 | 1.650 | 0.807 |
| sparse-8192 | 1.861 | 4.317 | 0.431 |
| mixed-short | 0.368 | 0.394 | 0.934 |
| mixed-long | 26.627 | 27.066 | 0.984 |

Raw process samples, ranges, source hashes and metadata: [node24-entities-escapeAttribute.json](./node24-entities-escapeAttribute.json).

## Reproduce

Use Node 24.22.2 and the unchanged source commit above, with the saved baseline-dist files. Install comparison dependencies before timing, then run sequentially:

```sh
npm ci --prefix bench/competitors --ignore-scripts
npm ci --prefix bench/results/esm-context-baseline-20261121/competitor-packages --ignore-scripts
node bench/results/esm-context-baseline-20261121/compare-context.mjs escapeText
node bench/results/esm-context-baseline-20261121/compare-context.mjs escapeAttribute
BENCH_VARIANTS=esm,escape-html,fast-escape-html,html-escaper BENCH_ROUNDS=4 \
  BENCH_OPERATION=escapeHTML BENCH_SOURCE_COMMIT="$(git rev-parse HEAD)" \
  BENCH_OUTPUT=bench/results/esm-context-baseline-20261121/node24-competitors-escapeHTML.json \
  node bench/competitors/run.mjs
node bench/results/esm-context-baseline-20261121/summarize-competition.mjs
```

The initial ESM-only matrix, bundle sizes and validation are in [README.md](./README.md). Competitor comparisons above have not been repeated on Node 22/26, other CPUs or browsers.

## Optimization acceptance criteria

Keep the public output and error contracts and current bundle-size budgets. Target lower per-case times against equivalent competitors, including short, unchanged, sparse, dense and mixed inputs. Remeasure the baseline and candidate in alternating order on Node 22/24/26; investigate regressions rather than hiding them in an aggregate. Confirm on additional CPUs and browser engines before claiming broader leadership.
