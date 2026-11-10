# Library comparison — 2026-11-10

Apple M2, macOS ARM64, Node.js 24.22.2. Three independent processes per
implementation, with rotated order; each input warms for 100 ms and measures
for 300 ms. Values below are medians of three process means, in microseconds
per call. Every call consumes the returned string with `Buffer.byteLength`.
This is a local string-to-string API comparison, not an Astro or cross-OS claim.

For the short converted string, `fast-escape-html` takes about 16% less time
than this package's native API. This package's native API is fastest among the
measured candidates on quoted JSON and Japanese/emoji. `@napi-rs/escape` is
faster on dense quotes but differs in escaping rules and UTF-16 preservation.

| Input | Our ESM | Our native | escape-html | fast-escape-html | html-escaper | @napi-rs/escape |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| short | 0.200 | 0.197 | 0.168 | 0.166 | 0.236 | 0.194 |
| unchanged-short | 0.054 | 0.055 | 0.056 | 0.056 | 0.080 | 0.145 |
| unchanged-long | 92.504 | 28.584 | 91.527 | 91.491 | 91.665 | 132.487 |
| quoted-json | 293.195 | 103.651 | 191.826 | 186.649 | 414.850 | 115.588 |
| japanese-emoji | 470.076 | 148.537 | 428.255 | 422.969 | 450.484 | 498.575 |
| long-body | 289.474 | 236.744 | 882.414 | 880.632 | 283.357 | 309.364 |
| dense-quotes | 520.979 | 174.832 | 268.113 | 264.917 | 634.521 | 147.299 |

Pinned versions: `escape-html@1.0.3`, `fast-escape-html@1.1.0`,
`html-escaper@3.0.3`, `@napi-rs/escape@1.0.1`. Our implementation is the adaptive
native wrapper from source commit `ac371f4`; API code is unchanged since that
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
