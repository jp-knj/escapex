# Static-site build benchmark

This runs the installed Astro CLI in a fresh Node process for every sample. It
compares the public native and Wasm APIs with `escape-html`, `fast-escape-html`,
and `html-escaper`. Native includes its JavaScript fast paths. The root JavaScript
API and native scalar implementation are not separate entries in this comparison.

```sh
npm ci
npm run build:all
npm ci --prefix bench/astro
npm ci --prefix bench/competitors --ignore-scripts
npm run bench:ssg
```

Use Node >=22.23.4 for pinned Astro 7.4.8. The library itself has a broader Node
support range. The Wasm build needs the Rust Wasm target and Binaryen; see the
existing build instructions. No dependency downloads occur inside measured builds.

Default protocol:

- Five independent builds per implementation, with the order rotated each round.
- Three synthetic sites: 1,000 article pages, 250 catalog pages with 64 items each,
  and 64 pages containing a 1,024-record JSON value in both an attribute and text.
- Article pages reuse a compiled Markdown component four times and have dynamic
  titles, metadata, author names, and navigation. This represents long static
  content with short dynamic inputs, not 1,000 separately compiled Markdown files.
- Serial rendering and Astro's experimental two-Worker prerendering. Both use
  `build.concurrency: 1`; Worker count zero means the main thread renders pages.
- Delete Astro's build cache and generated type metadata before every build.
  Disable Node's compile cache. OS filesystem caches are not flushed. This is a
  fresh-process, clean-build-cache experiment, not a cold-disk or warm-watch build.
- Time from spawning Node until process close, including compilation, module
  initialization, rendering, static file writes, and process teardown. Exclude
  dependency installation, fixture preparation, output hashing, and profiling.
- Record the main Node process's peak RSS, including Worker threads, and CPU time.
  Separately spawned processes are not included in RSS. Record API import time
  per rendering thread; Wasm includes reading and instantiating the binary.
- An untimed native build profiles actual escape input lengths, target counts,
  and unchanged inputs. Its outputs and input distribution must agree across
  Worker counts. Per-thread GC events are diagnostic only, with instrumentation
  overhead and possible final-event loss at Worker termination.
- Every build verifies the replacement was applied, the expected rendering
  threads loaded the chosen API, all pages exist, a canary is escaped, and every
  static file is byte-identical across libraries, rounds, and Worker counts.

The Vite plugin replaces only Astro's `escapeHTML` export. It preserves the other
runtime exports, including `HTMLString` identity. The adapter is an external ESM
module shared by all variants. Timed builds export the selected public function
directly, without a per-call timer, counter, or extra function wrapper.

Astro's `toAttributeString` is a separate implementation and is not replaced.
In the props fixture, the JSON text passes through the selected `escapeHTML`
once per page; the attribute uses Astro's own attribute escaping. The profile
therefore covers calls to the replaced export, not every string in the HTML.

Results and build logs are written to `target/ssg-results/`. `results.json` records
all raw samples, environment, source hashes, output hashes, and diagnostic inputs.
Generated HTML is removed after verification to limit disk use. A failed build
retains its working directory in `target/ssg-work/` for investigation.

Environment variables: `SSG_OUTPUT`, `SSG_ROUNDS` (at least 3), `SSG_VARIANTS`,
`SSG_SCENARIOS` (`articles,catalog,props`), and `SSG_WORKER_COUNTS` (`0,2`).
For an end-to-end correctness check with three pages per site and one round:

```sh
SSG_SMOKE=1 SSG_ROUNDS=1 SSG_OUTPUT=target/ssg-smoke npm run bench:ssg
```

Do not run two instances in the same checkout: the fixture's generated Astro
metadata is shared. Do not compare samples collected while other benchmarks run
on the same host. Report medians and ranges; overlapping ranges and small
differences are not evidence of a reliable winner. Performance has no pass/fail
gate in this workflow; correctness failures stop the run.

The dedicated SSG workflow runs Node 22, 24, and 26 on eight native targets:
macOS ARM64/x64, Linux glibc ARM64/x64, Linux musl ARM64/x64, and Windows ARM64/x64.
Each runner is a separate comparison; hosted-runner timings do not establish a
ranking between operating systems or CPU architectures. The musl jobs use native
Alpine containers, without CPU emulation. No release or npm publication occurs.

The Node 22 job selects 22.23.4 explicitly because a cached older patch release
can fail Astro's startup requirement. This is a benchmark dependency requirement,
not a change to the library's supported Node versions.

To verify downloaded workflow artifacts and rebuild the combined report:

```sh
python3 bench/ssg/collect.py ZIP_DIRECTORY REPORT_DIRECTORY SOURCE_COMMIT RUN_ID
```

The collector accepts comma-separated commit and run IDs for setup-only retries,
verifies all fixture and harness source hashes, reconstructs medians, checks
output equality and input profiles, and validates artifact digests when an
`artifacts.json` manifest is present. Windows Git checkout conversion to CRLF is
the only permitted source-byte difference. Empty build logs are indexed by size;
nonempty logs are copied into the report.
