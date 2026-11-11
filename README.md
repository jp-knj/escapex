# html-escape

<p align="center">
  <img src="./.github/assets/mascot.png" width="160" height="160" alt="Orange html-escape mascot with an ampersand">
</p>

Escape and unescape HTML strings in JavaScript and TypeScript.
For templates and static site generators that write text and quoted attribute
values into HTML.

## How

```sh
npm install @jp-knj/html-escape
```

```js
import { escape, unescape } from '@jp-knj/html-escape';

escape('<p>Hello & goodbye</p>'); // '&lt;p&gt;Hello &amp; goodbye&lt;/p&gt;'
unescape('&amp;lt;'); // '&lt;' (one decoding pass)
```

Use `escapeText` for text nodes and `escapeAttribute` for quoted attribute values.

## Why

Each match is replaced once. In the example above, unescaping stops at `&lt;`
instead of decoding it again into `<`. Other UTF-16 code units, including lone
surrogates, are left as they are.

The package is ESM with TypeScript definitions. The default import works in
Node.js and browser bundles. The `/native` and `/wasm` imports offer the same
API. See [API usage](USAGE.md) for setup and the supported characters.

## Benchmarks

The [benchmarks](bench/COMPARISON.md) compare API calls and Astro builds with
other libraries, with links to the measurements and scripts.
