# Adaptive HTML escaping comparison — 2026-11-10

Apple M2, macOS ARM64, Node.js 24.22.2. Production source matches
[11719c3](https://github.com/jp-knj/html-escape/commit/11719c3f35a1f7fe15ea8fa642b0b561bfa1456e).
The source and native binary hashes are in [binary provenance](binary-provenance.json);
built API and benchmark hashes are embedded in the [raw samples](competitors-darwin-arm64-node24.json).

## Method

Five fresh processes per implementation, with execution order rotated through all five positions.
Each case warms for at least 100 ms and 10,000 calls below 256 UTF-16 units, or 1,000 calls otherwise.
Measurement lasts at least 300 ms. Every timed call includes `Buffer.byteLength(result)`,
including output flattening. The statistic is the median of process means; ranges below are
observed minimum–maximum values, not confidence intervals. Import/startup is excluded.
The original 12 cases are followed by 13 additional position, spacing, boundary and changing-input cases.
`mixed-short` rotates 36 strings (7–255 units); `mixed-long` rotates 24 strings (256–16,384 units).
The input pools are repeated, not randomly generated on every call. Equivalent output is checked before timing.
All timed inputs are primitive strings. The contract probes preserve all UTF-16 units for our two APIs.
The competitors have differing non-string coercion contracts, recorded in the raw data.

Pinned competitor versions: `escape-html@1.0.3`, `fast-escape-html@1.1.0`, `html-escaper@3.0.3`.
These are the previously selected versions; this report does not claim they are the latest releases.

## Findings

- Default ESM has a lower median than all three rivals in 18/25 cases.
- Explicit native has a lower median than all three rivals in 23/25 cases.

These counts give each synthetic case equal weight and are not an application score.
The native misses are the two short unchanged strings: 0.3 and 0.5 ns above the fastest rival.
Several winning margins are also small, particularly the long body (about 0.1%).
The process ranges overlap for close comparisons; neither wins nor misses establish a universal ranking.
The native API uses the shared JavaScript function below 128 units. Its short timings are not Rust kernel timings.
At longer lengths it calls Rust after eight consecutive matches separated by fewer than 16 clean units;
other inputs finish in JavaScript. The quoted JSON, Japanese/emoji and dense quotes take the Rust path.
The unchanged long input returns from the JavaScript guard, and the long body takes the JavaScript path.

The earlier [12-case comparison](../competitors-20261110-search/README.md) is retained.
It used a lower long-input warmup minimum and a different number of implementations/processes.
Its numbers are historical, not a controlled paired estimate of this change.
In particular, the native long-body time was about 235 µs there and is about 290 µs here;
this local outcome does not support a claim that every input improved.

## Timings

Nanoseconds per call. Bold identifies the lowest median in a row only.

| Case | UTF-16 units | Our ESM | Our native | escape-html | fast-escape-html | html-escaper |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| short | 16 | **150.2** | 155.2 | 168.6 | 163.3 | 236.8 |
| unchanged-16 | 16 | **37.7** | 39.7 | 43.1 | 39.4 | 65.2 |
| first-16 | 16 | 106.9 | **103.6** | 114.0 | 111.1 | 127.7 |
| first-31 | 31 | **127.9** | 128.1 | 168.8 | 159.4 | 138.6 |
| first-32 | 32 | **128.3** | 128.5 | 171.7 | 164.2 | 141.6 |
| dense-31 | 31 | 364.5 | **360.0** | 376.6 | 365.9 | 937.6 |
| unchanged-short | 37 | **52.8** | 54.8 | 58.1 | 54.3 | 80.3 |
| unchanged-long | 155,648 | 93,717.7 | **28,690.7** | 93,622.3 | 93,330.7 | 93,323.8 |
| quoted-json | 33,171 | 184,073.0 | **73,602.9** | 189,256.3 | 182,682.7 | 421,121.4 |
| japanese-emoji | 44,032 | 408,611.7 | **131,378.0** | 430,168.9 | 412,421.8 | 460,642.2 |
| long-body | 349,440 | 292,506.2 | **289,839.4** | 885,005.9 | 884,708.2 | 290,140.0 |
| dense-quotes | 28,672 | 265,290.7 | **104,196.6** | 261,519.9 | 259,449.3 | 643,687.4 |
| first-24 | 24 | 126.3 | **122.3** | 152.0 | 147.0 | 137.2 |
| last-31 | 31 | 94.9 | **91.9** | 109.8 | 105.8 | 142.8 |
| two-near-31 | 31 | **139.7** | 139.9 | 176.1 | 172.1 | 172.5 |
| two-far-31 | 31 | 146.3 | **137.1** | 179.1 | 170.6 | 170.8 |
| dense-32 | 32 | 355.6 | **347.7** | 365.0 | 353.3 | 945.1 |
| dense-255 | 255 | 2,484.3 | **1,636.6** | 2,429.5 | 2,371.8 | 6,762.7 |
| first-255 | 255 | 237.1 | **236.6** | 672.8 | 632.3 | 267.6 |
| first-256 | 256 | **235.7** | 243.9 | 676.5 | 632.8 | 269.2 |
| spaced-8 | 1,024 | 4,643.1 | **1,876.1** | 4,717.3 | 4,328.1 | 5,190.8 |
| spaced-32 | 1,024 | 1,625.2 | **1,610.0** | 3,060.3 | 2,882.6 | 1,759.9 |
| sparse-8192 | 8,192 | **3,992.1** | 4,003.2 | 18,635.0 | 17,456.2 | 4,051.7 |
| mixed-short | 7–255 | 301.7 | **256.7** | 344.4 | 328.2 | 417.8 |
| mixed-long | 256–16,384 | 13,529.0 | **7,633.0** | 18,088.9 | 18,854.2 | 35,436.4 |

## Process ranges

Nanoseconds per call, minimum–maximum of five process means.

| Case | Our ESM | Our native | escape-html | fast-escape-html | html-escaper |
| --- | ---: | ---: | ---: | ---: | ---: |
| short | 146.5–150.9 | 152.6–155.5 | 165.0–169.1 | 161.6–164.1 | 233.1–237.4 |
| unchanged-16 | 36.9–37.9 | 39.4–40.1 | 41.4–43.2 | 39.2–39.5 | 64.6–65.4 |
| first-16 | 102.4–107.9 | 101.2–106.1 | 109.5–116.4 | 109.8–112.5 | 127.1–128.6 |
| first-31 | 123.8–129.5 | 123.6–128.7 | 161.7–169.9 | 158.0–160.1 | 137.6–139.4 |
| first-32 | 123.8–130.5 | 126.0–128.5 | 165.4–173.0 | 163.9–165.3 | 140.4–143.0 |
| dense-31 | 357.5–366.3 | 358.2–374.5 | 373.9–380.7 | 364.9–367.1 | 932.9–947.2 |
| unchanged-short | 51.9–53.8 | 54.7–55.1 | 56.3–58.6 | 53.7–54.4 | 79.5–80.5 |
| unchanged-long | 91,842.1–94,007.6 | 28,077.6–28,871.6 | 92,122.7–93,893.7 | 92,428.6–93,879.2 | 91,739.5–94,287.6 |
| quoted-json | 183,292.3–186,109.1 | 73,137.0–74,294.7 | 187,652.0–190,235.5 | 181,860.3–183,271.5 | 419,692.5–425,161.5 |
| japanese-emoji | 404,934.7–411,738.6 | 128,317.3–131,890.8 | 427,746.5–433,116.1 | 409,766.8–424,257.1 | 455,211.0–467,370.8 |
| long-body | 287,281.6–294,862.8 | 283,593.9–290,642.1 | 881,218.6–889,220.7 | 881,584.7–888,928.6 | 288,698.1–292,713.9 |
| dense-quotes | 263,796.1–266,713.3 | 102,584.6–105,292.5 | 261,196.5–263,319.2 | 256,830.8–273,100.8 | 640,838.5–651,365.3 |
| first-24 | 125.1–132.6 | 115.9–123.2 | 147.1–156.2 | 143.4–150.3 | 134.1–139.9 |
| last-31 | 92.3–97.6 | 88.7–94.5 | 105.6–110.6 | 103.2–105.9 | 138.5–143.4 |
| two-near-31 | 135.0–143.5 | 133.9–141.3 | 174.4–182.9 | 168.9–173.2 | 166.8–173.4 |
| two-far-31 | 142.9–147.6 | 134.9–137.4 | 174.6–180.0 | 168.5–170.9 | 166.9–173.3 |
| dense-32 | 354.9–368.0 | 342.3–350.8 | 362.2–368.1 | 351.5–359.3 | 937.3–959.3 |
| dense-255 | 2,461.9–2,509.6 | 1,611.4–1,646.0 | 2,418.9–2,483.3 | 2,337.0–2,923.9 | 6,705.4–6,837.4 |
| first-255 | 232.9–244.3 | 232.6–243.5 | 669.7–742.1 | 628.4–637.0 | 265.5–269.6 |
| first-256 | 223.6–237.0 | 241.0–248.5 | 672.8–677.9 | 630.9–636.8 | 265.5–270.8 |
| spaced-8 | 4,622.0–4,656.0 | 1,851.8–1,889.6 | 4,695.5–4,740.7 | 4,288.2–4,380.1 | 5,164.7–5,236.4 |
| spaced-32 | 1,613.5–1,635.2 | 1,600.4–1,619.4 | 3,033.4–3,101.1 | 2,860.5–2,916.8 | 1,753.2–1,781.6 |
| sparse-8192 | 3,931.5–4,028.4 | 3,941.3–4,008.4 | 18,500.7–18,683.9 | 17,271.0–17,885.1 | 4,045.6–4,075.8 |
| mixed-short | 297.9–304.3 | 256.4–258.0 | 341.7–345.8 | 327.5–331.4 | 416.5–419.6 |
| mixed-long | 13,476.3–13,618.4 | 7,595.8–7,688.9 | 17,918.7–19,975.3 | 18,720.5–18,894.7 | 35,347.6–35,565.3 |

## Reproduction

```sh
npm run build:all
npm ci --prefix bench/competitors --ignore-scripts
BENCH_VARIANTS=esm,native,escape-html,fast-escape-html,html-escaper BENCH_ROUNDS=5 node bench/competitors/run.mjs
```

Cross-platform results and Astro startup/memory measurements are recorded separately in the
[24-environment evaluation](../ci-competitive-20261110/README.md).
