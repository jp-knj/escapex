# Library-only search optimization

This evaluation changes html-escape's JavaScript only. The native entry delegates
short inputs through a small public function; its long-input path is a separate
private function. For inputs shorter than 128 units, the shared HTML scanner
emits the first known match directly and classifies subsequent UTF-16 units using the ASCII entity table. Code units
above 62 skip the table, and empty table entries represent non-target ASCII.
The existing global-regexp first search and bounded character scan are retained.

The predecessor is the packed-copy implementation at
`cf51cdce642d3a45d044d0e5eb61f89dab48319e`. `prepare-before.mjs` builds its actual
JavaScript and native binary using the candidate's pinned toolchain. It checks
that package locks, Cargo configuration and bundler configuration match, then
records the predecessor's source hashes. The candidate has the same Rust kernel,
Node-API string conversion, native dispatch and public exports as that baseline.

```sh
# Check out the predecessor separately at target/library-baseline first.
node bench/library/prepare-before.mjs
node bench/library/run.mjs
node bench/library/esm.mjs
```

Run the repository builds and install `bench/competitors` dependencies before
these commands. The predecessor checkout is nested under the current checkout,
so its bundler configuration resolves the current pinned tools from the ancestor
node_modules directory. The CI workflow installs the dependencies and performs
both builds without publishing packages.

The five variants are preceding native, current native, escape-html 1.0.3,
fast-escape-html 1.1.0 and html-escaper 3.0.3. Each runs in five fresh Node
processes, rotating through all five order positions. The unchanged 25-case
competitor worker checks outputs before timing, warms up for at least 100 ms and
10,000 short calls or 1,000 long calls, then measures at least 300 ms per case.
Every output is consumed with Buffer.byteLength. Imports and initialization are
excluded; these are public API measurements, not static-site build timings.

The JSON retains all rounds, medians, ranges, compatibility checks, machine
metadata, dependency-lock hashes, benchmark-source hashes, implementation-source
hashes, and both API/binary hashes. The module-selection hook is installed for
every variant and adds no per-call wrapper. `LIBRARY_APIS`, `LIBRARY_VARIANTS`,
`LIBRARY_ROUNDS` and `LIBRARY_OUTPUT` support isolated candidate screening. The
Native library workflow runs correctness on Node 22/24/26 across eight platform
packages, and the five-round native API comparison on Node 24 for every platform.
The ESM command separately compares the default entries in three fresh processes
per version using the same 25 cases. Both versions are called directly through
their ESM APIs; no native addon is loaded by the ESM comparison.

Three local screening runs preceded adoption. Input zero-fill removal and an
inline input buffer showed only small improvements on the tested host, so the
existing Utf16String conversion was retained. Using only a global regexp for the
native entry increased the unchanged-long case to roughly 3.3 times its prior
cost; that candidate was rejected. The final comparison separately measures the
selected JavaScript changes against the same packed-copy predecessor and the
three competitors. Screening values are not general performance guarantees.

An initial candidate also used the table in the long ESM scanner. A local
three-round comparison regressed quoted JSON by 7.29% and Japanese/emoji input by
5.48%, so that part was reverted before the final evaluation. A subsequent
isolated check put those cases at -0.02% and -0.40% versus the predecessor. The
final implementation retains the predecessor's long ESM scanner. The initial
candidate's native-only CI run is not presented as final-source validation.
