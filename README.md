# escapex

<p align="center">
  <img src="https://raw.githubusercontent.com/jp-knj/escapex/main/.github/assets/mascot.png" width="160" height="160" alt="Orange escapex mascot with an ampersand">
</p>

HTML escaping for templates, server-side rendering (SSR) and static site
generation (SSG). Use it when your code assembles HTML strings from plain text.
Typed ESM for Node.js 22+ and browser bundles, with optional native and WebAssembly
implementations.

## Install and render HTML

```sh
npm install escapex
```

```js
import { escapeText, escapeAttribute } from 'escapex';

const title = 'Tea & <toast>';
const label = 'Say "hello"';
const html = `<p title="${escapeAttribute(label)}">${escapeText(title)}</p>`;
// <p title="Say &quot;hello&quot;">Tea &amp; &lt;toast&gt;</p>
```

Use `escapeText` for HTML text and `escapeAttribute` inside quoted plain
attributes. `escape` / `escapeHTML` escape all five HTML characters;
`unescape` / `unescapeHTML` decode the ten supported references once.
Other UTF-16 code units, including lone surrogates, are preserved.

If a template engine or framework already escapes interpolated values, pass
the original text to it. Applying both layers turns `&` into `&amp;amp;`.
These functions do not sanitize HTML or validate URLs, CSS or JavaScript.

## Choose an implementation

| Import | Use |
|---|---|
| `escapex` | JavaScript; start here for templates, SSR, SSG and browsers. No initialization. |
| `escapex/native` | Optional Node.js addon for measured workloads; keep optional dependencies enabled. |
| `escapex/wasm` | Explicit WebAssembly use; load the supplied asset and await `init` once. |

All three expose the same string functions. Native and Wasm performance depends
on the input and runtime; measure your complete rendering or build workload.
See [the usage guide](USAGE.md) for SSR/SSG examples, setup and API contracts.

## Migrating from `@jp-knj/html-escape`

Replace the dependency with `escapex@0.0.1` and change import prefixes from
`@jp-knj/html-escape` to `escapex`, including `/native`, `/wasm` and Wasm asset
imports. Function names, types, output and asset filenames are unchanged.
The eight optional packages now use `escapex-<platform>` names. Existing packages
and releases remain available. See [migration details](USAGE.md#migration).

## Benchmarks

The [benchmark comparison](https://github.com/jp-knj/escapex/blob/main/bench/COMPARISON.md)
retains the measurements and conditions recorded under the former name.
It includes API calls, Astro builds, regressions and links to raw evidence.
The rename makes no new performance claim.
