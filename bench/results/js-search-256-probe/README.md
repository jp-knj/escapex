# Preliminary 256-unit search cutoff

This discarded implementation applied the test-plus-lastIndex character scan
to HTML inputs shorter than 256 UTF-16 units. Apple M2, Node 24.22.2, three
independent processes per variant; the complete public API and output byte-length
consumption were measured. The baseline is the ESM implementation from 7ba356c.

The 16-unit example improved from 196.8 to 153.9 ns, but a single target at the
start of 64 units increased from 114.2 to 227.2 ns, and at the start of 255 units
from 153.2 to 661.6 ns. These failures motivated limiting the character scan
to inputs shorter than 32 units. This file is historical evidence, not a
measurement of the final implementation. The native column also includes its
existing 256-unit JS/Rust cutoff, a separate decision from the JS search method.

[All samples](search-darwin-arm64-node24.json).
