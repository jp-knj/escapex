# Native API

```ts
import {
  escape, escapeHTML, escapeText, escapeAttribute, unescape, unescapeHTML,
} from 'escapex/native';

escape('<a title="example">');
// '&lt;a title=&quot;example&quot;&gt;'
```

All six exports are synchronous `(value: string) => string` functions. `escape`
and `escapeHTML` are the same function, as are `unescape` and `unescapeHTML`.
TypeScript declarations are included. The default package import remains ESM.

| Function | Replacements |
| --- | --- |
| `escape` / `escapeHTML` | `&`, `<`, `>`, `'`, `"` |
| `escapeText` | `&`, `<`, `>` |
| `escapeAttribute` | The five HTML characters plus CR and LF |
| `unescape` / `unescapeHTML` | One layer of `&amp;`, `&#38;`, `&lt;`, `&#60;`, `&gt;`, `&#62;`, `&apos;`, `&#39;`, `&quot;`, `&#34;` |

Apostrophes become `&#39;`, quotes become `&quot;`, CR becomes `&#13;`, and LF
becomes `&#10;`. Unrecognized references, including hexadecimal references and
`&#13;` / `&#10;`, are preserved by `unescape`, matching the existing API.
All functions reject non-primitive strings with the same TypeError messages as
the ESM implementation. They preserve NUL, BOM, surrogate pairs, and isolated
surrogates. Attribute escaping applies to quoted plain attribute values; URL,
CSS, script and event-handler validation are separate concerns.

## Implementation

HTML escaping shares the default JavaScript implementation for inputs shorter
than 128 UTF-16 units. At 128 units or more, a nonglobal regexp finds the first
match while preserving the unchanged-string exit. A global regexp consumes
subsequent positions without searching the same prefix again. Eight consecutive
matches separated by fewer than 16 clean UTF-16 units select Rust; otherwise
JavaScript finishes the output. This avoids Node-API copies for single-match
and widely spaced inputs. It is an input-based heuristic, not a guarantee that
every possible distribution favors the selected implementation.

The shared JavaScript HTML function uses a global `RegExp.test()` and begins
at `lastIndex - 1`. Inputs up to 16 units use character scanning. Inputs below
128 units return to regexp search after a bounded clean run. Longer
inputs use regexp search for separated matches and a renewable 16-unit
character window for nearby matches. A final segment of at most 32 units is
scanned directly. ASCII classification pairs `&` with apostrophe and `<` with
`>` using bitwise comparisons, preserving every other UTF-16 value.
Every invocation resets the relevant regexp state.

`escapeText`, `escapeAttribute` and unescaping retain their existing algorithms
and separate 256-unit JS/Rust cutoff. Longer inputs check for a matching
character or supported reference before Rust is called. Node-API uses
[`Utf16String`](https://docs.rs/napi/3.16.1/napi/bindgen_prelude/struct.Utf16String.html)
in both directions; it does not decode through Rust `String` / UTF-8.

NEON and SSE2 compare eight `u16` lanes; AVX2 compares sixteen. Each loaded
vector produces a mask whose set bits are all consumed before advancing to the
next vector. Clean spans are copied only when a replacement is emitted or the
input ends. A scalar tail handles fewer than one vector's worth of input.
The output vector starts at input length and grows as needed. Each replacement
reserves room for its clean span, entity and the known minimum remaining output
in one check. Four-, five- and six-unit entity copies use constant sizes so
LLVM can emit inline stores. Only the initialized prefix is exposed. There is
no output-size pre-scan and no shared mutable input/output storage.

CPU detection selects a function once with `OnceLock`. AVX2 is enabled only on
the relevant functions and selected only on a supporting x86-64 CPU. The
binary's baseline does not require AVX2. The build script discards inherited
Rust target flags to avoid accidentally distributing `target-cpu=native` code.
Each Worker receives its own Node-API environment; only the immutable Rust
function selection is shared. Unescaping uses the existing Rust decoder.

The `native` Cargo feature enables the optional napi-rs dependencies. Without
that feature the Wasm build remains `no_std` and has no Node-API dependency.
`native-scalar` is a benchmark-only feature with the same wrapper (including
the short-string path), ABI and allocation strategy, selecting the scalar scanner.

## Build and packages

The Rust crate lives in `src/rust/`, with its Cargo manifest, lockfile and
build script alongside `src/rust/src/`. Both native and Wasm builds use it.
The TypeScript entry files `native.ts` and `wasm.ts` match the public import
subpaths. JavaScript transformations live in `escape.ts` and `unescape.ts`.
Rust host interfaces live in `napi_bindings.rs` and `wasm_bindings.rs`;
the escaping and decoding algorithms live in separate modules.

Prerequisites: Node.js 22 or newer, Rust 1.91.1, the
`wasm32-unknown-unknown` target, and Binaryen 117's `wasm-opt` on PATH (or set
`WASM_OPT` to its executable).

```sh
npm ci
cargo fetch --manifest-path src/rust/Cargo.toml --locked
npm run build:all
npm run check
npm run check:native
npm run test:all
```

`npm run build` continues to build ESM and Wasm. `build:all` also builds the host
native addon. `build:js` cleans `dist`, so rebuild native after it when working
locally. A Node-only development loop can use `build:js` followed by
`build:native` without Binaryen.

`node scripts/native.mjs --target <Rust triple>` builds a specified target if
the appropriate Rust standard library and linker are installed. It writes a
local binary to `dist/native/` and stages a platform package in `npm/<id>/`.
`node scripts/native.mjs --metadata` refreshes all platform manifests without
building binaries. The root package contains only the ESM wrapper and types;
matching optional packages supply the binaries.

The source lockfile resolves the eight optional packages from their local
`npm/<id>` directories, allowing `npm ci` before publication. The published
root manifest still uses exact registry versions; npm excludes the source
lockfile from its tarball. Refresh these lock entries with the metadata command
after changing a package version or platform restriction.

| Package suffix | Rust target | CI runtime |
| --- | --- | --- |
| `darwin-arm64` | `aarch64-apple-darwin` | macOS 15 ARM64 |
| `darwin-x64` | `x86_64-apple-darwin` | macOS 15 Intel |
| `linux-arm64-gnu` | `aarch64-unknown-linux-gnu` | Ubuntu 22.04 ARM64 |
| `linux-x64-gnu` | `x86_64-unknown-linux-gnu` | Ubuntu 22.04 x86-64 |
| `linux-arm64-musl` | `aarch64-unknown-linux-musl` | Alpine 3.23 ARM64 |
| `linux-x64-musl` | `x86_64-unknown-linux-musl` | Alpine 3.23 x86-64 |
| `win32-arm64-msvc` | `aarch64-pc-windows-msvc` | Windows 11 ARM64 |
| `win32-x64-msvc` | `x86_64-pc-windows-msvc` | Windows Server 2022 x86-64 |

Full package names are `escapex-<suffix>`. Every package has matching
version, `os`, `cpu`, and (on Linux) `libc` metadata. The glibc CI builds use
Ubuntu 22.04; compatibility with older glibc systems is not asserted. CI tests
Node.js 22, 24 and 26 on each row, and archives npm tarballs on Node 24. CI has
no publishing or release step.

The `verify/native-*` branches also run these workflows. Node 24 runs three
independent micro/isolated rounds and nine paired rounds on each target.
The same branches measure the three JavaScript competitors on all Node versions,
using three independent processes per implementation, the original 12 and 13
additional cases, including changing-input pools.
A manual Native workflow run can
enable the same measurements with the `benchmarks` input. Each matrix job
archives its OS, CPU model, Node/Rust architecture, Rust test output and any
benchmark JSON as `evidence-<target>-node<major>`. The environment check rejects
a mismatched Node/Rust architecture or libc. Hosted runners execute the CPU
instructions natively; these are not QEMU runs.

Keep npm optional dependencies enabled when installing. Explicit native import
throws an error with the platform, expected package and original loader cause
if the addon is missing, incompatible or corrupt. It does not silently switch
implementations. Missing native packages do not prevent default ESM/Wasm use.

## Verification and evaluation

Rust tests compare scalar, dispatch, and every CPU-supported implementation
against the existing Rust writer. They cover all 65,536 UTF-16 values in every
lane, every 16-lane match pattern, unaligned starts, all short tail lengths,
consecutive targets, and million-unit inputs. On AVX2 hosts SSE2 is tested
directly as well. Unsupported instruction sets are never invoked.

Node tests verify all exports, exhaustive UTF-16 inputs, exact TypeErrors,
no-op calls that never cross Node-API, repeated calls, concurrent Workers,
actual npm tarball installation, absent/corrupt binaries, and declarations in
Bundler and NodeNext modes. Existing ESM, Wasm, bundler, and browser checks are
retained. See [benchmark instructions](../bench/README.md) and
[recorded evaluation](../bench/results/README.md) for measurements and limits.

The [current real-machine evaluation](../bench/results/ci-competitive-20261110/README.md)
completed all 24 target/Node correctness checks, directly exercising NEON,
SSE2 and AVX2. Existing Chromium, Firefox and WebKit checks also passed.
The three-competitor suite includes the original 12 and 13 additional cases;
the goal of winning every case on every environment is not met. The
[five-round local comparison](../bench/results/competitors-20261110-adaptive/README.md)
records lower native medians than all three rivals in 23 of 25 cases on Apple M2.
Other machines and Node versions have additional misses, all recorded.

In the current nine-process paired Astro protocol, five of eight targets met
the large-props requirement of at least 5% less time than current ESM.
macOS x86-64 measured -2.29%, Linux ARM64 musl -0.17%, and Linux x86-64 musl
+1.86%, failing that gate. Every target met the two short-page limits.
The report retains all isolated-protocol outcomes, cold imports, memory
figures, the failed gates and an evidence-upload retry. These results do not
establish a general native speedup.

The [preceding validation](../bench/results/ci-js-search-20261110/README.md)
met the planned gates on all eight targets with the earlier ESM implementation.
Its hosted-runner measurements are not a paired before/after estimate of the
current adaptive change. Both current APIs are optimized; native remains an
explicit option and the default package import remains ESM.

The earlier search-change suite compares the retained pre-change ESM function with
the current ESM/native APIs on every target with Node 22/24/26. Its original
16-unit example has a lower median in all 24 combinations, but one difference
is only 0.54% and single-target inputs can regress. The
[local before/after report](../bench/results/local-js-search-20261110/README.md)
records about 21% less time for that example and about 44% more time for a
31-unit string with one leading target. The complete Astro before/after
changes are below 1%; this does not establish a page-level speedup from the
JavaScript search change. The native-versus-ESM render measurements above
answer a separate comparison. Earlier measurements remain available in the
[pre-change report](../bench/results/ci-20261110-paired-v2/README.md).

Both current protocols include fresh Container creation and complete HTML
collection. The initial harness reused a Container whose route table grew on
every render; those [historical results](../bench/results/ci-20261110/README.md)
do not establish steady render costs. All earlier results and failures remain
available alongside the corrected measurements. Native remains an explicit
option; the default API remains ESM.
