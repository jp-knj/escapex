# Follow-up limited to HTML

This candidate keeps `OutputBuffer` only for `escape_html`; `escape_text` and
`escape_attribute` again allocate a Vec per call and return `Utf16String`.
The shared scanner still accepts a mutable Vec, so this does not restore the
baseline scanner ABI for those two methods.

The [raw local context comparison](contexts/local.json) includes all five
initial and five additional processes per variant. The final attribute
regressions are 5.39% for `dense-256`, 5.63% for `sparse-8192` and 8.81% for
`mixed-sizes`. This fails the predefined 5% limit, so the candidate was not
promoted to eight-target timing or to production.

Local Node 22/24/26 correctness, Worker and lifetime checks passed, as did Rust
tests, formatting and native clippy. Their logs and the build manifest are in
this directory. The frozen binding source and runners are under
`bench/rust-buffers/html-only-*.mjs` and `html-only-bindings.rs`.
