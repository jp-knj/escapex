# Using escapex

The default JavaScript, WebAssembly and optional Node.js native entries expose
the same synchronous string functions. Every entry supports ESM imports and
TypeScript. Node.js 22 or newer is required for Node consumers.

```js
import { escapeHTML, escapeText, escapeAttribute, unescapeHTML } from 'escapex';

escapeHTML('A < B & "quoted"'); // 'A &lt; B &amp; &quot;quoted&quot;'
escapeText('A < B & "quoted"'); // 'A &lt; B &amp; "quoted"'
escapeAttribute('one\r\ntwo'); // 'one&#13;&#10;two'
unescapeHTML('&amp;lt;'); // '&lt;' (one decoding pass)
```

| Function | Contract |
|---|---|
| `escape`, `escapeHTML` | Escape `&`, `<`, `>`, single and double quotes. These names are aliases. |
| `escapeText` | Escape `&`, `<`, `>` for HTML text nodes. |
| `escapeAttribute` | Escape the five HTML characters and CR/LF for quoted plain attribute values. |
| `unescape`, `unescapeHTML` | Decode `&amp;`, `&#38;`, `&lt;`, `&#60;`, `&gt;`, `&#62;`, `&apos;`, `&#39;`, `&quot;`, `&#34;` once. These names are aliases. |

Only primitive strings are accepted; other values throw `TypeError`. Unknown
references are preserved. All implementations preserve every other JavaScript
UTF-16 code unit, including isolated surrogates and NUL.

These functions encode text and quoted attribute values. They do not sanitize
HTML markup or validate URLs, CSS, event handlers, or script/style content.

## Templates, SSR and SSG

Choose the function at the point where plain text enters your HTML string.
Keep attribute values quoted and element/attribute names fixed:

```js
import { escapeText, escapeAttribute } from 'escapex';

export function renderCard({ title, description }) {
  return `<article title="${escapeAttribute(description)}"><h2>${escapeText(title)}</h2></article>`;
}

const html = renderCard({
  title: 'Tea & <toast>',
  description: 'Say "hello"\r\nNext line',
});
// <article title="Say &quot;hello&quot;&#13;&#10;Next line"><h2>Tea &amp; &lt;toast&gt;</h2></article>
```

An SSR handler can return this string as its HTML response. An SSG can reuse
the same function and write the result at build time:

```js
import { writeFile } from 'node:fs/promises';
import { renderCard } from './render-card.mjs';

await writeFile('card.html', renderCard({
  title: 'Tea & <toast>',
  description: 'Say "hello"\r\nNext line',
}), 'utf8');
```

Save the preceding renderer as `render-card.mjs`. For a JSON data attribute,
serialize first and then escape the resulting string, as in the native example
below. Escaping a URL attribute does not check whether its URL scheme is allowed.
Do not use these functions for unquoted attributes or script/style contents.

### Avoid double escaping

Frameworks and template engines often escape interpolations automatically.
Pass them the original plain text. Use escapex when your code owns the HTML
string construction; do not pre-escape a value that another layer will escape.

```js
import { escapeText } from 'escapex';

escapeText('Tea & toast'); // 'Tea &amp; toast'
escapeText(escapeText('Tea & toast')); // 'Tea &amp;amp; toast'
```

Escaping is intentionally not idempotent. Do not unescape untrusted input to
compensate for applying an escaping layer twice; remove the duplicate layer.

## Choosing an entry

Start with `escapex`: synchronous JavaScript, no initialization, compatible with
Node.js and browser bundles. Choose `/native` only for Node.js workloads where
measurement justifies the addon. Choose `/wasm` when you want to load and manage
WebAssembly explicitly. All entries have the same string functions and output;
only `/wasm` needs asynchronous initialization before use.

## Native entry

```js
import { escapeAttribute } from 'escapex/native';

const attribute = escapeAttribute(JSON.stringify({ title: '日本語 😀 "quoted"' }));
const html = `<div data-props="${attribute}"></div>`;
```

The native entry is Node.js only. Install optional dependencies so npm can
select its matching package. macOS, Linux and Windows support ARM64 and x86-64;
Linux has separate glibc and musl packages. Every native package must match the
main package's version. A missing or incompatible addon causes an explicit
import error with the platform and underlying cause.

The native API uses JavaScript for short strings and some sparse HTML inputs.
Long suitable inputs use Rust with runtime NEON/SSE2/AVX2 selection. No caller
CPU flag is required, and independent Node Workers are supported.

Native is an explicit choice; the default import remains JavaScript and is
usable in browser bundles. Performance depends on input size, match spacing,
string copies and runtime. The recorded API results are not a claim that every
case or a complete static-site build is faster. See the repository's
[benchmark reports](https://github.com/jp-knj/escapex/tree/main/bench/results).

## WebAssembly entry

Initialize once before calling the synchronous functions:

```js
import { readFile } from 'node:fs/promises';
import { init, escapeHTML } from 'escapex/wasm';

await init(await readFile(new URL(import.meta.resolve('escapex/escape_html.wasm'))));
escapeHTML('日本語 😀 <text>');
```

For browser bundlers, load `escapex/escape_html.wasm` as an asset
and pass its fetched bytes to `init(new Uint8Array(await response.arrayBuffer()))`.
The package also includes `escape_html.scalar.wasm`. Initialization failures can
be retried. Calling the Wasm API before successful initialization throws.

## Migration

Replace the old dependency and refresh your application's lockfile:

```sh
npm uninstall @jp-knj/html-escape
npm install escapex@0.0.1
```

| Before | After |
|---|---|
| `@jp-knj/html-escape` | `escapex` |
| `@jp-knj/html-escape/native` | `escapex/native` |
| `@jp-knj/html-escape/wasm` | `escapex/wasm` |
| `@jp-knj/html-escape/escape_html.wasm` | `escapex/escape_html.wasm` |
| `@jp-knj/html-escape/escape_html.scalar.wasm` | `escapex/escape_html.scalar.wasm` |
| `@jp-knj/html-escape-<platform>` | `escapex-<platform>` |

Normally npm selects the native package through optional dependencies. If you
explicitly pin a platform package, rename it too and use version `0.0.1` for both
packages. No function, type, escaping output or Wasm asset filename changes.
The repository is now [jp-knj/escapex](https://github.com/jp-knj/escapex).
Old npm packages and the existing `v0.0.1` GitHub tag/release are preserved;
future escapex releases use `escapex-v<version>` tags.
