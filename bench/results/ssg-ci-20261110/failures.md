# Initial setup failure and recovery

The initial workflow finished with 24 successful jobs and one failure: the Wasm
preparation job plus 23 successful environment comparisons, and the macOS x64
Node 22 environment that failed before any timed build.

That runner's cached Node 22.23.2 did not meet Astro 7.4.8's Node >=22.23.4
requirement. The failure was at the first diagnostic build's CLI version check.
It was not an output mismatch or a rejected performance result. The initial
[error log](failed-attempts/darwin-x64-node22.log) and uploaded
[environment](failed-attempts/darwin-x64-node22/native-environment.json) are retained.

The final SSG workflow pins its Node 22 jobs to 22.23.4. A dedicated verification
branch ran only macOS x64 with that version. Its fixture, harness, library code,
dependencies, number of rounds, order, and assertions were unchanged. The
recovery workflow succeeded, producing all 150 timed and six diagnostic builds.
No completed speed measurement was discarded or rerun.

| Attempt | Source commit | Workflow | Result |
|---|---|---|---|
| Initial full matrix | `79c0f63ea166dceabebb79279cb3c560cb3c1fc0` | [42829392447](https://github.com/jp-knj/html-escape/actions/runs/42829392447) | 23 environments completed; macOS x64 Node 22 failed startup |
| macOS x64 Node 22.23.4 | `b736e163074629eabcb69bdaff65c9b089f3ebb7` | [42831080918](https://github.com/jp-knj/html-escape/actions/runs/42831080918) | Completed |

The recovery branch narrows the workflow matrix to that one environment; the
workspace workflow retains all 24 environments. The collector verifies both
source snapshots against the same fixture and harness content, allowing only
Windows Git checkout line-ending conversion. Raw job metadata and artifact
IDs/digests are stored alongside this report.
