# Local interpretation

These are medians of five independent full Astro builds on Apple M2, Node
24.22.2, Astro 7.4.8. All 150 timed builds and six independent profiling builds
completed and produced byte-identical static files within each scenario. No
sample was discarded or rerun. See [all samples and ranges](README.md).
All 156 build logs were empty; their names and sizes are recorded in
`build-log-sizes.json`.

| Scenario | Main-thread native vs fastest competitor | Two-Worker native vs fastest competitor |
|---|---:|---:|
| 1,000 article pages | +0.34% | +0.09% |
| 250 catalog pages | +0.47% | +1.07% |
| 64 large-JSON pages | -7.14% | -2.35% |

Negative means less wall time. The competitor baseline is the lowest median
among `escape-html`, `fast-escape-html`, and `html-escaper` within each row and
Worker configuration. This is a descriptive comparison, not a significance test.

Article and catalog results do not establish a native advantage. Every profiled
escape input in those sites was at most 49 UTF-16 units. Article inputs were
unchanged in 66.67% of calls; all 1,000 pages together made only 6,000 calls to
the replaced export. Static Markdown text does not become one long escape input.

The props site made 64 calls with JSON lengths up to 162,559 UTF-16 units. Its
native median was 0.829 seconds versus 0.893 seconds for `escape-html`, 0.897 for
`fast-escape-html`, 0.898 for `html-escaper`, and 0.881 for Wasm. One native sample
was 0.910 seconds; the native range overlaps the competitors' ranges. The result
supports a median improvement for this fixture and environment, not a universal
speed guarantee or a claim that every individual build is faster.

Peak memory depends on parallelism. For props, median peak RSS was 479.9 MiB for
native versus 501.8 MiB for `escape-html` on the main thread. With two Workers,
native used 608.3 MiB versus 569.9 MiB for `escape-html`. Two Workers did not
produce a useful native wall-time improvement for this fixture size. Article
and catalog builds also gained memory overhead without a wall-time improvement.

Median native API initialization took about 1.1 ms on the main rendering thread
and 1.7 ms per Worker. The corresponding main-thread Wasm initialization was
about 0.3 ms, and the JavaScript competitors about 0.2 ms. These costs are
included in full build time and are small relative to these complete builds.

Astro's separate attribute escaping was not replaced. JSON appears in both a
`data-props` attribute and a text node, but only the text goes through the chosen
`escapeHTML`. Input profiles count that export's calls, not all generated text.

This is a clean Astro build-cache experiment with uncontrolled OS filesystem
caches, excluding dependency installation. It does not measure a particular
production site, warm incremental builds, or installation reliability. The
original Container benchmarks and their recorded failures remain separate;
this comparison does not supersede them or establish the original ESM gate.

Source snapshot: local commit `2de7af9664e32f487014361640ba4e1c73c9b715`.
The CI implementation is commit `79c0f63ea166dceabebb79279cb3c560cb3c1fc0`;
the harness and fixture source are identical, with separate commit histories.
Source and compiled-file SHA-256 values are in `results.json`.
