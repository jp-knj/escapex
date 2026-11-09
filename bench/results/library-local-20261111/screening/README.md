# Exploratory measurements

These are candidate-selection runs, not final-source results. Each screen used
three independent processes per candidate with the same 25-case worker. The
recorded JavaScript module hashes were checked against the source snapshots in
`sources/`. Rust input-buffer experiments were not adopted; their prototype
source is archived as text. Native binaries are not distributed here.

- Screen 1: global-regexp native entry, uninitialized input allocation, and both.
- Screen 2: ASCII table, an added code-unit upper-bound check, and inline input storage.
- Screen 3: table with first-match peeling, table with a separate native long function, and both.
- Initial API: five-round candidate comparison, before reverting the long ESM table change.
- Initial ESM: three-round default-entry comparison that detected long JSON and Unicode regressions.
- Restricted ESM probe: three-round check after restoring the predecessor's long scanner.

The initial source is GitHub commit `a6ac9c650af3c663620afd16d3f9f103197f8778`.
Protocol metadata subsequently added the dedicated ESM driver and its hashes.
The final report uses a separate measurement set after that revision; no raw
samples or hashes in this exploratory set were rewritten.
