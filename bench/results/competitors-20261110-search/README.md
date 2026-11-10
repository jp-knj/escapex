# Library comparison after JavaScript search adoption — 2026-11-10

Apple M2, macOS ARM64, Node.js v24.22.2. Seven independent processes per implementation,
with a rotated order that gives each implementation every position once.
Each case warms for at least 100 ms and 10,000 calls for inputs shorter than
256 UTF-16 units (32 calls otherwise), then measures for at least 300 ms.
Every timed call includes Buffer.byteLength of the returned string, including
rope flattening and byte-length calculation. Initialization and module imports
are outside the timed region. This compares synchronous string-to-string APIs.
The statistic is the median of seven process means. It is not an Astro result,
a cross-platform result, or a confidence interval.

The production API matches tested source
[6339332](https://github.com/jp-knj/html-escape/commit/633933225dc4aa08a82602b8857a349272016748).
The raw sourceCommit identifies the local pre-measurement snapshot 61f4077.
Harness and built API SHA-256 hashes are embedded in the raw data; native
binary/source hashes are recorded separately in [binary provenance](binary-provenance.json).

## Findings

The original short example takes 158.2 ns in our ESM API and
153.7 ns in our native API, versus 162.9 ns in fast-escape-html.
The ESM median is 2.8% below fast-escape-html in this run. The native
entry delegates to the same ESM function for this input; this is not a native
Rust kernel timing. The observed process ranges below overlap for some of
these close results, so exact short-input ranks should not be generalized.

Our native API has the lowest median in each of the five large-input cases.
The unchanged long input returns from its JavaScript guard without calling
Rust. JSON, Japanese/emoji, sparse long body and dense quotes include native
UTF-16 transfers and output consumption. The leading-single-target 31-unit
case is fastest with html-escaper, demonstrating why an overall winner would
need a defined application workload.

## Timings

All values below are microseconds per call; smaller is better. Bold marks the
lowest sample median in each row, not a claim of statistically distinct ranks.
All implementations and all cases are retained, including single-target
inputs that were unfavorable in the old/new ESM comparison.

| Input | UTF-16 units | Our ESM | Our Wasm | Our native | escape-html | fast-escape-html | html-escaper | @napi-rs/escape |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| short | 16 | 0.158 | 0.312 | **0.154** | 0.165 | 0.163 | 0.236 | 0.193 |
| unchanged-16 | 16 | **0.038** | 0.039 | 0.039 | 0.043 | 0.039 | 0.066 | 0.119 |
| first-16 | 16 | 0.104 | 0.257 | **0.102** | 0.116 | 0.111 | 0.129 | 0.137 |
| first-31 | 31 | 0.150 | 0.310 | 0.149 | 0.168 | 0.158 | **0.139** | 0.161 |
| first-32 | 32 | **0.107** | 0.315 | 0.107 | 0.170 | 0.159 | 0.140 | 0.154 |
| dense-31 | 31 | 0.363 | 0.667 | **0.357** | 0.379 | 0.366 | 0.940 | 0.371 |
| unchanged-short | 37 | **0.053** | 0.056 | 0.054 | 0.058 | 0.054 | 0.081 | 0.146 |
| unchanged-long | 155648 | 92.708 | 92.048 | **28.600** | 91.843 | 91.668 | 91.932 | 132.797 |
| quoted-json | 33171 | 294.267 | 292.758 | **73.940** | 192.566 | 186.215 | 422.281 | 115.867 |
| japanese-emoji | 44032 | 477.837 | 398.114 | **129.971** | 429.800 | 412.044 | 455.798 | 501.620 |
| long-body | 349440 | 293.339 | 1110.808 | **235.400** | 889.388 | 786.269 | 287.297 | 310.596 |
| dense-quotes | 28672 | 529.411 | 345.587 | **102.937** | 268.297 | 260.421 | 642.418 | 147.856 |

These cases have different lengths and escape frequencies. Counting case wins
or averaging them would impose arbitrary workload weights. In particular,
ESM and native share the same JavaScript function below 256 units, so close
short-input differences do not identify separate algorithms. The JavaScript
character scan is used below 32 units; longer ESM input retains regexp search.
Wasm uses its complete public wrapper and UTF-16 transfers.

## Process variation

Minimum–maximum process means, in microseconds per call. These describe the
seven observed samples, not uncertainty bounds for future runs.

| Input | Our ESM | Our Wasm | Our native | escape-html | fast-escape-html | html-escaper | @napi-rs/escape |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| short | 0.153–0.158 | 0.305–0.317 | 0.151–0.155 | 0.164–0.167 | 0.162–0.165 | 0.234–0.238 | 0.192–0.195 |
| unchanged-16 | 0.037–0.039 | 0.039–0.040 | 0.039–0.040 | 0.043–0.043 | 0.039–0.040 | 0.065–0.068 | 0.116–0.122 |
| first-16 | 0.101–0.106 | 0.253–0.312 | 0.100–0.104 | 0.113–0.117 | 0.110–0.114 | 0.128–0.135 | 0.135–0.141 |
| first-31 | 0.147–0.151 | 0.306–0.324 | 0.148–0.151 | 0.164–0.168 | 0.154–0.159 | 0.137–0.145 | 0.154–0.161 |
| first-32 | 0.106–0.108 | 0.310–0.330 | 0.106–0.110 | 0.167–0.171 | 0.157–0.195 | 0.139–0.145 | 0.152–0.156 |
| dense-31 | 0.356–0.366 | 0.645–0.733 | 0.353–0.360 | 0.378–0.381 | 0.365–0.368 | 0.933–0.947 | 0.367–0.372 |
| unchanged-short | 0.052–0.054 | 0.054–0.056 | 0.053–0.055 | 0.058–0.060 | 0.054–0.054 | 0.080–0.083 | 0.140–0.147 |
| unchanged-long | 91.759–93.273 | 91.815–93.394 | 28.138–29.502 | 91.495–92.798 | 91.299–92.995 | 91.538–93.840 | 131.261–138.616 |
| quoted-json | 291.315–294.303 | 287.415–294.843 | 71.962–74.560 | 191.490–213.586 | 186.027–186.492 | 419.775–425.002 | 114.714–116.481 |
| japanese-emoji | 465.221–479.376 | 389.958–401.231 | 128.086–131.158 | 427.987–432.927 | 407.975–413.144 | 453.241–459.755 | 492.125–502.647 |
| long-body | 290.636–295.566 | 1099.236–1115.453 | 232.058–237.361 | 883.737–896.482 | 780.749–792.380 | 283.079–290.019 | 306.738–319.395 |
| dense-quotes | 525.372–530.934 | 339.420–349.211 | 100.957–103.793 | 266.757–272.144 | 259.172–263.785 | 638.298–645.750 | 146.203–150.319 |

## Compatibility and scope

| Implementation | Lone surrogates preserved | Identical apostrophe spelling | Escapes slash |
| --- | --- | --- | --- |
| Our ESM | Yes | Yes | No |
| Our Wasm | Yes | Yes | No |
| Our native | Yes | Yes | No |
| escape-html | Yes | Yes | No |
| fast-escape-html | Yes | Yes | No |
| html-escaper | Yes | Yes | No |
| @napi-rs/escape | No | No | Yes |

All timed inputs are well-formed UTF-16 and use primitive strings. Equivalent
HTML is asserted before timing. The native competitor emits `&#x27;` for
apostrophes and `&#x2f;` for slashes, so it may produce a longer output. Those
differences are normalized only for the correctness check, never while timing.
It replaces lone surrogates with U+FFFD in the explicit probe. Thus its API is
not an exact drop-in replacement despite equivalent HTML for timed inputs.
The raw nonStringContract probes document further differences in input
coercion and error types. A probe with neither result nor error returned
undefined, which JSON omits. Unescaping, Buffer and asynchronous APIs are not
measured; pre-encoding would omit costs paid by synchronous string APIs.

Pinned versions: `@napi-rs/escape@1.0.1`, `escape-html@1.0.3`, `fast-escape-html@1.1.0`, `html-escaper@3.0.3`.
These are the same competitor versions used in the earlier comparison; this
run does not assert that they are the latest published versions.

## Reproduce

```sh
npm run build:all
npm ci --prefix bench/competitors --ignore-scripts
BENCH_ROUNDS=7 node bench/competitors/run.mjs
```

[Raw samples](competitors-darwin-arm64-node24.json).
[Earlier comparison before the search change](../competitors-20261110-output/README.md).
Earlier and current numbers were collected in separate runs; the earlier
table is history, not a paired before/after estimate.
