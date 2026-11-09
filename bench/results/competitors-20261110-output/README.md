# Library comparison after native output optimization — 2026-11-10

Apple M2, macOS ARM64, Node.js 24.22.2. Three independent processes per
implementation, with rotated order; each input warms for 100 ms and measures
for 300 ms. Values below are medians of three process means, in microseconds
per call. Every call consumes the returned string with `Buffer.byteLength`.
This is a local string-to-string API comparison, not an Astro or cross-OS claim.

For the short converted string, `fast-escape-html` takes about 16% less time
than this package's native API. This package's native API is fastest among the
measured candidates on quoted JSON, Japanese/emoji and dense quotes.
`@napi-rs/escape` differs in escaping rules and UTF-16 preservation.

| Input | Our ESM | Our native | escape-html | fast-escape-html | html-escaper | @napi-rs/escape |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| short | 0.206 | 0.197 | 0.168 | 0.166 | 0.237 | 0.192 |
| unchanged-short | 0.055 | 0.058 | 0.056 | 0.056 | 0.081 | 0.145 |
| unchanged-long | 96.399 | 29.090 | 93.665 | 94.264 | 94.002 | 133.173 |
| quoted-json | 293.227 | 73.824 | 192.474 | 185.890 | 423.457 | 116.479 |
| japanese-emoji | 471.036 | 132.278 | 429.926 | 422.662 | 454.499 | 504.889 |
| long-body | 305.291 | 237.972 | 885.292 | 887.126 | 290.247 | 312.030 |
| dense-quotes | 521.281 | 104.623 | 269.144 | 265.597 | 641.473 | 148.523 |

Pinned versions: `escape-html@1.0.3`, `fast-escape-html@1.1.0`,
`html-escaper@3.0.3`, `@napi-rs/escape@1.0.1`. Our implementation is the adaptive
native wrapper from source commit `6fa439c`; API code is unchanged since that
commit. These microbenchmarks are unaffected by the Astro Container correction.

## Compatibility

All timed inputs are well-formed UTF-16. Output equivalence is checked before
measurement. `@napi-rs/escape` emits `&#x27;` for apostrophes and also escapes
`/` as `&#x2f;`; those spellings are normalized only for the correctness check,
never in the timed region. That library converts lone surrogates to U+FFFD.
The three JavaScript competitors preserve them in the explicit probe. These
facts mean that the native competitor is not an exact replacement for this API.
Non-string coercion contracts and unescaping are outside this comparison.

The Buffer and asynchronous APIs of `@napi-rs/escape` are deliberately excluded:
pre-encoding inputs would omit costs paid by the synchronous string APIs.

## Reproduce

```sh
npm run build:all
npm ci --prefix bench/competitors --ignore-scripts
node bench/competitors/run.mjs
```

[Raw samples and compatibility probes](competitors-darwin-arm64-node24.json).
Sources: [escape-html](https://github.com/component/escape-html),
[fast-escape-html](https://github.com/SukkaW/fast-escape-html),
[html-escaper](https://github.com/WebReflection/html-escaper),
[@napi-rs/escape package](https://www.npmjs.com/package/@napi-rs/escape).

Previous [comparison before output optimization](../competitors-20261110/README.md).
