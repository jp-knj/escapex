# Using html-escape

The default JavaScript, WebAssembly and optional Node.js native entries expose
the same synchronous string functions. Every entry supports ESM imports and
TypeScript. Node.js 22 or newer is required for Node consumers.

```js
import { escapeHTML, escapeText, escapeAttribute, unescapeHTML } from '@jp-knj/html-escape';

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

## Native entry

```js
import { escapeAttribute } from '@jp-knj/html-escape/native';

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
[benchmark reports](https://github.com/jp-knj/html-escape/tree/main/bench/results).

## WebAssembly entry

Initialize once before calling the synchronous functions:

```js
import { readFile } from 'node:fs/promises';
import { init, escapeHTML } from '@jp-knj/html-escape/wasm';

await init(await readFile(new URL(import.meta.resolve('@jp-knj/html-escape/escape_html.wasm'))));
escapeHTML('日本語 😀 <text>');
```

For browser bundlers, load `@jp-knj/html-escape/escape_html.wasm` as an asset
and pass its fetched bytes to `init(new Uint8Array(await response.arrayBuffer()))`.
The package also includes `escape_html.scalar.wasm`. Initialization failures can
be retried. Calling the Wasm API before successful initialization throws.
