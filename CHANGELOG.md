# Changelog

## 0.1.0 — unreleased

- Typed ESM APIs for HTML text, quoted attributes and one-pass unescaping.
- JavaScript, WebAssembly and optional napi-rs native implementations preserving
  all UTF-16 code units, including isolated surrogates.
- Runtime NEON, SSE2 and AVX2 selection, with a scalar fallback.
- Eight native packages for macOS/Linux/Windows ARM64 and x86-64, including
  separate Linux glibc and musl builds.
- Worker, package, bundler and full UTF-16 correctness coverage.
- Recorded API and static-site benchmarks, including regressions and unmet
  performance targets; no universal speedup claim.

Version 0.0.0 is reserved for the future initial OIDC placeholder setup. No
placeholder or functional version is published by the preparation workflow.
