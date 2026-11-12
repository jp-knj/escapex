# Rust output buffer experiments

Result: retain the production implementation. See the
[complete measurements and decision](../results/rust-buffers-20261112/README.md).

These experiments keep the JavaScript public API, dispatch thresholds, UTF-16
semantics and Rust scanning algorithm fixed. The baseline sources are copied
from `eda293bec2bc54e9e77c3d206bebb586bb635087`.

| Candidate | Change | Trade-off |
| --- | --- | --- |
| `capacity` | Initially allocate twice the input length. | Avoids the first growth caused by the padded entity store; larger initial allocation. |
| `reuse` | Give the scanner a caller-owned Vec and cache it after creating the JS string. | Removes warmed output allocations; retains up to 2 MiB per thread. |

The reuse candidate takes ownership out of a thread-local `Cell<Vec<u16>>`.
Nested calls receive distinct allocations and hold no dynamic borrow across
Node-API. Returning a result or an error drops its owner, which clears the Vec
and caches it only when its capacity is within the limit. Node-API's
[`napi_create_string_utf16`](https://nodejs.org/api/n-api.html#napi_create_string_utf16)
copies the units before the buffer is returned. No JavaScript value borrows
the cached allocation. Input conversion and unescaping are unchanged.

The supplied Rust PR notes suggested these directions:

- [Oxc #29212](https://github.com/oxc-project/oxc/pull/29212): make the result
  owner explicit and transfer Vec allocations for reuse. Its reported runtime
  result was neutral; an allocation reduction alone does not establish speed.
- [Vize #11327](https://github.com/ubugeeei-prod/vize/pull/11327): preserve owned
  input until the last borrow and avoid copying it into another owner. The
  current napi `Utf16String` does not expose its Vec for this transfer. This
  experiment reuses the output allocation instead.
- [Biome #12813](https://github.com/biomejs/biome/pull/12813): separate heap
  cleanup from the timed region. The existing competitor worker already calls
  `global.gc()` after warmup and before timing.

## Reproduction

Build the existing JS/native/Wasm assets and fetch the locked Cargo dependencies
first. Then run with Node 24:

```sh
node bench/rust-buffers/prepare.mjs
node bench/rust-buffers/check-rust.mjs
node bench/rust-buffers/check.mjs
node bench/rust-buffers/allocation.mjs
node bench/rust-buffers/run.mjs
```

Run `check.mjs` with Node 22 and 26 as well. The CI workflow covers all eight
native targets and all three Node versions, with performance measured on Node
24. Preparation builds all candidates with the same compiler, locked
dependencies and release flags, copying the identical JS bundle into each.

The performance comparison uses the unmodified competitor worker and all 64
selection fixtures. Each candidate runs in five fresh processes, rotating their
order. Each fixture gets at least 100 ms warmup (and at least 10,000 short-input
or 1,000 long-input calls), then at least 300 ms measurement. `Buffer.byteLength`
consumes every output. If any case regresses by over 5%, that candidate and the
baseline get five more processes. The final median must not regress by over 5%
on any case. All measurements, including failures, are retained. This suite
measures `escapeHTML`; correctness covers all public functions. Changes to other
functions require additional performance evaluation before adoption.

`context-run.mjs` evaluates 12 text/attribute fixtures with the same warmup,
consumption and 5/10-process rules. It was run on all eight targets and locally.
The initial reuse candidate failed this additional gate on macOS ARM64.

`html-only-prepare.mjs`, `html-only-check.mjs`, `html-only-check-rust.mjs` and
`html-only-context-run.mjs` reproduce the follow-up that caches only HTML output.
It still changes the scanner's Vec interface for all modes, and failed the
local context gate. No additional eight-target or HTML timing run was required
to reject it. `html-only-run.mjs` is retained as the prepared, unexecuted HTML
comparison; no results are claimed for that run.

The allocation probe measures only Rust's output allocation, after warming
the same input size for the reuse candidate. It excludes input conversion and
the JavaScript string allocation, and asserts the expected allocation counts.
It is not a runtime benchmark.
