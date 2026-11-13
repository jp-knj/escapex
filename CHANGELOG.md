# Changelog

## escapex 0.0.1 (release candidate)

- Rename `@jp-knj/html-escape` to `escapex` and its eight optional native
  packages to `escapex-<platform>`, all at `0.0.1`.
- Move the repository to `jp-knj/escapex`; future tags use `escapex-v<version>`.
  The old packages, releases and `v0.0.1` tag are preserved.
- Add template, SSR and SSG examples, entry selection, migration instructions
  and guidance on avoiding double escaping.
- Preserve all function names, types, output, `/native`, `/wasm` and Wasm asset
  filenames. Migration changes dependency names and import prefixes only.
- Retain previous benchmarks and their measurement conditions. Performance
  changes and new APIs are deferred to the next version.

### Included functionality

- Typed ESM APIs for HTML text, quoted attributes and one-pass unescaping.
- JavaScript, WebAssembly and optional napi-rs native implementations preserving
  all UTF-16 code units, including isolated surrogates.
- Runtime NEON, SSE2 and AVX2 selection, with a scalar fallback.
- Eight native packages for macOS/Linux/Windows ARM64 and x86-64, including
  separate Linux glibc and musl builds.
- Worker, package, bundler and full UTF-16 correctness coverage.
- Recorded API and static-site benchmarks, including regressions and unmet
  performance targets; no universal speedup claim.

This candidate has not been published. Initial npm registration, placeholder
publication, Trusted Publisher setup and publication are separate release steps.
