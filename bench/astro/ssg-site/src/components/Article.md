# Building a static archive

A static site produces its pages before a visitor requests them. An article can
contain a large amount of text while most dynamic values remain short. This body
is compiled from Markdown once and reused across the article routes.

## Content and navigation

A page combines the article, a title, an author, publication metadata, navigation,
and links to related posts. Those parts do not necessarily pass through the same
escaping function. This fixture measures the calls made by Astro itself.

```js
const title = 'HTML & JavaScript';
const example = '<section data-name="example">';
```

The archive has no external images, fonts, or network requests. Its input data and
page paths are deterministic. Each comparison writes every HTML file to disk.

## UTF-16 content

日本語の記事と絵文字 🌸 🦀 を含みます。ページの見出しと説明には HTML & CSS を使います。

| Format | Produced at build time |
| --- | --- |
| Markdown | Article body |
| Astro | Layout and dynamic values |
| HTML | Static output |

## Repeated article sections

Long articles often share one layout with many other pages. The rendering cost
also includes component calls, routing, serialization, and file writes. Comparing
the complete build captures these costs alongside the escaping functions.

This is a reproducible fixture, not a measurement of a deployed production site.
Its purpose is to expose how different kinds of input affect the full build.
