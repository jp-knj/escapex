# ESM context API baseline

Source: [7e9cfbd](https://github.com/jp-knj/escapex/commit/7e9cfbda9ddaea4dca68adc342eaf8546c3ecfe5). No runtime or benchmark implementation changes were made for this measurement.

Host: Apple M2, darwin arm64, Darwin 25.5.0.

Measured from 2026-11-21T13:50:00.852659+00:00 through 2026-11-21T14:07:36.255602+00:00.

Additional same-output comparisons against published libraries: [COMPETITION.md](./COMPETITION.md).

## Protocol

- Measure the public default ESM entry. Run escapeText and escapeAttribute over 28 inputs each; retain escapeHTML over 25 inputs as a control for future changes.
- Five fresh processes per API and Node version. Node versions and APIs run sequentially; this task runs no concurrent build or benchmark. Background system load and CPU frequency are uncontrolled.
- For each input, warm up for at least 100 ms and 10,000 calls below 256 UTF-16 units or 1,000 calls otherwise. Explicit GC follows warmup; measure for at least 300 ms.
- Include Buffer.byteLength of every result. Exclude import and initialization time. Validate output against the independent oracle before timing.
- Report the median of five process means, with minimum and maximum. These ranges are not confidence intervals. Input pools rotate within each timed process.
- Record SHA-256 hashes for sources, built ESM files, lockfiles, build configuration and the benchmark harness. Validate identical hashes across all nine datasets.
- Preserve the exact measured ESM files under baseline-dist/ for future before/after measurements.
- API operations escape different character sets; timings across operations do not represent equivalent work. This is a microbenchmark on one Apple M2, not a full-build or cross-platform result.

| Node | V8 |
|---|---|
| v22.21.1 | 12.4.254.21-node.33 |
| v24.22.2 | 13.6.233.17-node.63 |
| v26.13.0 | 14.6.202.34-node.40 |

Power-state snapshots, local Node paths, run order and source commit: [protocol.json](./protocol.json).

## escapeText

Microseconds per call: median (minimum to maximum). Each column contains five independent process samples.

| Case | UTF-16 units | Pool | Node 22 | Node 24 | Node 26 |
|---|---:|---:|---:|---:|---:|
| short | 16 | 1 | 0.118 (0.118 to 0.119) | 0.153 (0.142 to 0.169) | 0.132 (0.128 to 0.134) |
| unchanged-16 | 16 | 1 | 0.029 (0.029 to 0.029) | 0.035 (0.034 to 0.035) | 0.029 (0.027 to 0.036) |
| first-16 | 16 | 1 | 0.075 (0.074 to 0.076) | 0.101 (0.098 to 0.108) | 0.084 (0.081 to 0.084) |
| first-31 | 31 | 1 | 0.090 (0.089 to 0.097) | 0.107 (0.106 to 0.109) | 0.093 (0.092 to 0.093) |
| first-32 | 32 | 1 | 0.092 (0.091 to 0.093) | 0.110 (0.108 to 0.117) | 0.091 (0.090 to 0.094) |
| dense-31 | 31 | 1 | 0.713 (0.706 to 0.714) | 0.749 (0.715 to 0.797) | 0.722 (0.708 to 0.754) |
| unchanged-short | 37 | 1 | 0.039 (0.039 to 0.039) | 0.041 (0.040 to 0.048) | 0.033 (0.033 to 0.036) |
| unchanged-long | 155648 | 1 | 68.267 (66.120 to 68.487) | 28.812 (28.578 to 31.173) | 12.863 (12.615 to 18.087) |
| quoted-json | 33171 | 1 | 81.941 (81.377 to 82.135) | 76.751 (76.206 to 78.712) | 84.897 (80.663 to 87.613) |
| japanese-emoji | 44032 | 1 | 316.934 (316.095 to 319.108) | 333.062 (329.832 to 348.841) | 266.697 (261.766 to 355.126) |
| long-body | 349440 | 1 | 214.837 (212.470 to 216.835) | 139.540 (133.461 to 144.726) | 72.419 (69.514 to 78.079) |
| dense-quotes | 28672 | 1 | 360.629 (358.953 to 361.606) | 339.299 (332.048 to 354.480) | 348.255 (339.691 to 383.081) |
| first-24 | 24 | 1 | 0.087 (0.086 to 0.087) | 0.102 (0.099 to 0.104) | 0.096 (0.089 to 0.097) |
| last-31 | 31 | 1 | 0.094 (0.093 to 0.094) | 0.101 (0.098 to 0.106) | 0.094 (0.088 to 0.095) |
| two-near-31 | 31 | 1 | 0.114 (0.113 to 0.114) | 0.132 (0.128 to 0.133) | 0.118 (0.112 to 0.122) |
| two-far-31 | 31 | 1 | 0.116 (0.115 to 0.116) | 0.128 (0.127 to 0.139) | 0.117 (0.116 to 0.151) |
| dense-32 | 32 | 1 | 0.702 (0.701 to 0.707) | 0.720 (0.711 to 0.767) | 0.705 (0.691 to 0.977) |
| dense-255 | 255 | 1 | 5.211 (5.186 to 5.214) | 5.400 (5.102 to 5.565) | 5.186 (5.174 to 5.514) |
| first-255 | 255 | 1 | 0.207 (0.207 to 0.207) | 0.151 (0.148 to 0.158) | 0.111 (0.107 to 0.116) |
| first-256 | 256 | 1 | 0.207 (0.207 to 0.209) | 0.155 (0.154 to 0.157) | 0.111 (0.110 to 0.120) |
| spaced-8 | 1024 | 1 | 4.870 (4.849 to 4.883) | 4.860 (4.639 to 4.964) | 4.556 (4.523 to 5.191) |
| spaced-32 | 1024 | 1 | 1.559 (1.552 to 1.575) | 1.375 (1.331 to 1.442) | 1.348 (1.293 to 1.426) |
| sparse-8192 | 8192 | 1 | 3.786 (3.772 to 4.029) | 1.898 (1.859 to 1.987) | 0.991 (0.977 to 1.079) |
| mixed-short | 7 to 255 | 36 | 0.285 (0.282 to 0.286) | 0.301 (0.295 to 0.360) | 0.247 (0.238 to 0.271) |
| mixed-long | 256 to 16384 | 24 | 25.628 (25.470 to 25.635) | 24.560 (24.513 to 25.098) | 23.502 (23.168 to 24.870) |
| quotes-only | 256 | 1 | 0.161 (0.159 to 0.161) | 0.080 (0.080 to 0.084) | 0.047 (0.047 to 0.049) |
| line-endings | 1280 | 1 | 0.576 (0.575 to 0.577) | 0.273 (0.271 to 0.294) | 0.136 (0.134 to 0.141) |
| mixed-context | 15 to 257 | 27 | 0.513 (0.510 to 0.514) | 0.529 (0.527 to 0.552) | 0.457 (0.432 to 0.503) |

Raw data: [Node 22](./node22-escapeText.json), [Node 24](./node24-escapeText.json), [Node 26](./node26-escapeText.json).

## escapeAttribute

Microseconds per call: median (minimum to maximum). Each column contains five independent process samples.

| Case | UTF-16 units | Pool | Node 22 | Node 24 | Node 26 |
|---|---:|---:|---:|---:|---:|
| short | 16 | 1 | 0.171 (0.170 to 0.218) | 0.201 (0.197 to 0.209) | 0.180 (0.179 to 0.222) |
| unchanged-16 | 16 | 1 | 0.028 (0.027 to 0.029) | 0.039 (0.038 to 0.039) | 0.031 (0.031 to 0.032) |
| first-16 | 16 | 1 | 0.074 (0.073 to 0.082) | 0.096 (0.095 to 0.099) | 0.082 (0.080 to 0.102) |
| first-31 | 31 | 1 | 0.087 (0.086 to 0.089) | 0.110 (0.109 to 0.113) | 0.094 (0.092 to 0.108) |
| first-32 | 32 | 1 | 0.088 (0.088 to 0.095) | 0.111 (0.108 to 0.113) | 0.092 (0.091 to 0.107) |
| dense-31 | 31 | 1 | 0.773 (0.771 to 0.865) | 0.789 (0.754 to 0.816) | 0.761 (0.746 to 0.784) |
| unchanged-short | 37 | 1 | 0.040 (0.040 to 0.041) | 0.053 (0.053 to 0.054) | 0.045 (0.044 to 0.048) |
| unchanged-long | 155648 | 1 | 76.096 (73.829 to 103.665) | 94.452 (93.628 to 97.936) | 77.876 (77.421 to 91.088) |
| quoted-json | 33171 | 1 | 286.672 (286.067 to 289.680) | 294.153 (291.760 to 364.615) | 298.413 (295.199 to 326.974) |
| japanese-emoji | 44032 | 1 | 519.896 (514.301 to 654.089) | 566.777 (554.810 to 592.726) | 445.668 (439.952 to 518.789) |
| long-body | 349440 | 1 | 255.433 (252.829 to 261.830) | 304.781 (298.771 to 319.587) | 249.734 (241.000 to 264.504) |
| dense-quotes | 28672 | 1 | 679.681 (678.076 to 682.122) | 643.376 (624.048 to 669.434) | 654.131 (633.294 to 676.366) |
| first-24 | 24 | 1 | 0.086 (0.085 to 0.086) | 0.113 (0.111 to 0.134) | 0.097 (0.093 to 0.114) |
| last-31 | 31 | 1 | 0.093 (0.092 to 0.099) | 0.108 (0.104 to 0.120) | 0.094 (0.093 to 0.110) |
| two-near-31 | 31 | 1 | 0.111 (0.111 to 0.116) | 0.139 (0.134 to 0.145) | 0.116 (0.115 to 0.136) |
| two-far-31 | 31 | 1 | 0.116 (0.114 to 648.422) | 0.140 (0.131 to 0.145) | 0.118 (0.116 to 0.142) |
| dense-32 | 32 | 1 | 0.798 (0.782 to 0.991) | 0.768 (0.753 to 0.787) | 0.776 (0.767 to 0.781) |
| dense-255 | 255 | 1 | 5.882 (5.801 to 15.700) | 5.755 (5.635 to 6.363) | 5.677 (5.655 to 5.757) |
| first-255 | 255 | 1 | 0.192 (0.189 to 0.559) | 0.236 (0.230 to 0.248) | 0.194 (0.187 to 0.204) |
| first-256 | 256 | 1 | 0.190 (0.186 to 0.202) | 0.238 (0.231 to 0.252) | 0.187 (0.184 to 0.200) |
| spaced-8 | 1024 | 1 | 4.932 (4.839 to 6.465) | 4.962 (4.918 to 6.037) | 5.064 (4.802 to 6.074) |
| spaced-32 | 1024 | 1 | 1.520 (1.507 to 1.886) | 1.630 (1.621 to 2.133) | 1.594 (1.567 to 1.714) |
| sparse-8192 | 8192 | 1 | 3.050 (2.996 to 3.095) | 4.047 (3.995 to 4.506) | 3.154 (3.129 to 3.257) |
| mixed-short | 7 to 255 | 36 | 0.349 (0.334 to 0.350) | 0.376 (0.370 to 0.379) | 0.313 (0.307 to 0.319) |
| mixed-long | 256 to 16384 | 24 | 28.109 (27.534 to 29.149) | 27.150 (26.899 to 27.751) | 27.870 (27.434 to 29.709) |
| quotes-only | 256 | 1 | 5.746 (5.715 to 6.187) | 5.439 (5.322 to 5.654) | 5.640 (5.514 to 5.714) |
| line-endings | 1280 | 1 | 8.944 (8.831 to 9.495) | 9.097 (8.950 to 9.906) | 9.369 (9.351 to 10.065) |
| mixed-context | 15 to 257 | 27 | 1.163 (1.130 to 1.229) | 1.318 (1.284 to 1.353) | 1.058 (1.048 to 1.094) |

Raw data: [Node 22](./node22-escapeAttribute.json), [Node 24](./node24-escapeAttribute.json), [Node 26](./node26-escapeAttribute.json).

## escapeHTML

Microseconds per call: median (minimum to maximum). Each column contains five independent process samples.

| Case | UTF-16 units | Pool | Node 22 | Node 24 | Node 26 |
|---|---:|---:|---:|---:|---:|
| short | 16 | 1 | 0.127 (0.125 to 0.136) | 0.143 (0.142 to 0.146) | 0.153 (0.149 to 0.162) |
| unchanged-16 | 16 | 1 | 0.027 (0.027 to 0.028) | 0.039 (0.038 to 0.039) | 0.032 (0.032 to 0.037) |
| first-16 | 16 | 1 | 0.082 (0.082 to 0.084) | 0.104 (0.102 to 0.106) | 0.092 (0.092 to 0.097) |
| first-31 | 31 | 1 | 0.108 (0.107 to 0.110) | 0.121 (0.120 to 0.125) | 0.106 (0.105 to 0.111) |
| first-32 | 32 | 1 | 0.110 (0.109 to 0.111) | 0.122 (0.121 to 0.125) | 0.107 (0.106 to 0.108) |
| dense-31 | 31 | 1 | 0.337 (0.332 to 0.388) | 0.349 (0.347 to 0.350) | 0.379 (0.377 to 0.384) |
| unchanged-short | 37 | 1 | 0.041 (0.040 to 0.041) | 0.054 (0.053 to 0.057) | 0.046 (0.046 to 0.047) |
| unchanged-long | 155648 | 1 | 74.676 (74.198 to 76.267) | 93.898 (93.179 to 99.907) | 77.823 (77.589 to 79.520) |
| quoted-json | 33171 | 1 | 196.130 (194.620 to 226.429) | 187.880 (186.667 to 189.986) | 219.244 (216.271 to 273.274) |
| japanese-emoji | 44032 | 1 | 427.492 (419.248 to 435.589) | 421.108 (418.099 to 422.684) | 333.621 (329.664 to 339.287) |
| long-body | 349440 | 1 | 257.208 (246.432 to 265.565) | 291.923 (288.136 to 307.922) | 236.329 (235.347 to 239.522) |
| dense-quotes | 28672 | 1 | 290.439 (288.034 to 352.776) | 259.992 (257.957 to 261.072) | 315.536 (314.151 to 325.290) |
| first-24 | 24 | 1 | 0.110 (0.107 to 0.112) | 0.124 (0.123 to 0.129) | 0.113 (0.113 to 0.118) |
| last-31 | 31 | 1 | 0.080 (0.079 to 0.081) | 0.093 (0.091 to 0.094) | 0.083 (0.082 to 0.083) |
| two-near-31 | 31 | 1 | 0.121 (0.120 to 0.153) | 0.140 (0.138 to 0.141) | 0.121 (0.120 to 0.141) |
| two-far-31 | 31 | 1 | 0.134 (0.133 to 0.166) | 0.144 (0.141 to 0.159) | 0.131 (0.131 to 0.132) |
| dense-32 | 32 | 1 | 0.345 (0.344 to 0.389) | 0.349 (0.348 to 0.352) | 0.400 (0.399 to 0.407) |
| dense-255 | 255 | 1 | 2.607 (2.579 to 2.821) | 2.452 (2.438 to 2.455) | 2.836 (2.805 to 2.919) |
| first-255 | 255 | 1 | 0.192 (0.190 to 0.210) | 0.237 (0.236 to 0.242) | 0.195 (0.192 to 0.196) |
| first-256 | 256 | 1 | 0.193 (0.191 to 0.235) | 0.232 (0.228 to 0.235) | 0.194 (0.192 to 0.195) |
| spaced-8 | 1024 | 1 | 5.255 (5.203 to 5.399) | 4.382 (4.374 to 4.388) | 5.011 (4.992 to 5.029) |
| spaced-32 | 1024 | 1 | 1.552 (1.508 to 1.965) | 1.622 (1.612 to 1.627) | 1.585 (1.579 to 1.593) |
| sparse-8192 | 8192 | 1 | 3.084 (3.056 to 3.370) | 4.022 (3.993 to 4.035) | 3.146 (3.129 to 3.196) |
| mixed-short | 7 to 255 | 36 | 0.291 (0.285 to 0.297) | 0.300 (0.300 to 0.303) | 0.252 (0.250 to 0.260) |
| mixed-long | 256 to 16384 | 24 | 13.877 (13.756 to 14.837) | 13.417 (13.345 to 13.425) | 15.689 (15.327 to 15.919) |

Raw data: [Node 22](./node22-escapeHTML.json), [Node 24](./node24-escapeHTML.json), [Node 26](./node26-escapeHTML.json).

## Individual-export bundle sizes

Measured with Node v24.22.2, Rolldown 1.3.0 and Vite 8.3.6; built with tsdown 0.23.7.

Single named export, minified browser ESM bundle from installed npm pack archive; source-path line comments removed before raw and gzip measurement.

| Bundler | Export | Bytes | Gzip bytes |
|---|---|---:|---:|
| rolldown | escapeHTML | 1313 | 582 |
| rolldown | escapeText | 529 | 331 |
| rolldown | escapeAttribute | 545 | 341 |
| rolldown | unescapeHTML | 326 | 241 |
| vite | escapeHTML | 1761 | 678 |
| vite | escapeText | 656 | 373 |
| vite | escapeAttribute | 672 | 383 |
| vite | unescapeHTML | 384 | 262 |

The existing gzip limits are 355/365 bytes for Rolldown escapeText/escapeAttribute and 395/405 bytes for Vite. Future optimization should retain those limits.

Raw sizes and bundle hashes: [bundle-sizes.json](./bundle-sizes.json).

## Validation

- Rebuilt JavaScript and both Wasm artifacts from the recorded source commit: [build.log](./build.log).
- All 29 ESM, Wasm, package/bundler, documentation and benchmark tests passed before measurements: [verification.log](./verification.log).
- Benchmark workers checked each corpus input against the independent oracle before timing.
- This report generator verifies all process samples, medians, ranges, source hashes and the saved ESM artifact hashes.

## Reproduce

Use a checkout of the source commit above and install root dependencies with npm ci. Build with npm run build:js using Node 24.22.2. For every Node version in the table, run the following sequentially, setting NODE_BIN to that exact Node executable and RESULT_DIR to a new output directory:

```sh
for operation in escapeText escapeAttribute escapeHTML; do
  NODE_OPTIONS= BENCH_VARIANTS=esm BENCH_ROUNDS=5 \
    BENCH_OPERATION="$operation" BENCH_SOURCE_COMMIT="$(git rev-parse HEAD)" \
    BENCH_OUTPUT="$RESULT_DIR/$operation.json" \
    "$NODE_BIN" bench/competitors/run.mjs
done
```

Set a different RESULT_DIR for each Node version. Competitor packages and native artifacts are not required for these ESM-only timings. Build both Wasm artifacts with npm run build before rerunning the package verification.

Reproduce individual-export bundle sizes with Node 24.22.2 after npm run build, and before starting any timed measurements:

```sh
node bench/results/esm-context-baseline-20261121/measure-bundles.mjs
```

Regenerate this report from the recorded data without rerunning measurements:

```sh
node bench/results/esm-context-baseline-20261121/summarize.mjs
```

When assessing an optimization, remeasure the saved baseline and the candidate on the same host and runtime in alternating order. A comparison against this earlier run alone cannot separate code effects from changes in system load.
