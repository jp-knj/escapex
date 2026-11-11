# Release preparation

Current status: **unreleased**. The intended first functional version is
`0.1.0`. This checkout only prepares and verifies candidates. Neither the
workflow nor the repository scripts run `npm publish`, create a release tag,
or create a GitHub Release.

The root README intentionally remains `# html-escape`; the packaged
[USAGE.md](../USAGE.md) documents the APIs.

## Initial package setup with azu's CLI

The pinned development tool is
[setup-npm-trusted-publish 2.2.0](https://github.com/azu/setup-npm-trusted-publish).
It creates an empty administrative package for configuring npm Trusted
Publishing. Its default invocation publishes that placeholder, so this
repository invokes it with `--dry-run` only:

```sh
npm ci
npm run release:setup
```

This previews all eight platform packages and the main package with placeholder
version `0.0.0`, public access and the npm registry. Files, logs and package
settings links are saved under `target/release-setup/`. The command accepts no
extra arguments and cannot be switched into a publishing mode. It does not
authenticate or modify npm package settings; names are not reserved by a preview.

| Package |
|---|
| `@jp-knj/html-escape-darwin-arm64` |
| `@jp-knj/html-escape-darwin-x64` |
| `@jp-knj/html-escape-linux-arm64-gnu` |
| `@jp-knj/html-escape-linux-x64-gnu` |
| `@jp-knj/html-escape-linux-arm64-musl` |
| `@jp-knj/html-escape-linux-x64-musl` |
| `@jp-knj/html-escape-win32-arm64-msvc` |
| `@jp-knj/html-escape-win32-x64-msvc` |
| `@jp-knj/html-escape` |

## Build a candidate without publishing

Run the **Prepare release (no publishing)** GitHub Actions workflow at the
reviewed source commit. It calls the existing CI and Native workflows, including
Node 22/24/26, all eight native platform packages and the browser tests. After
all jobs succeed, it downloads the native tarballs from that same workflow run,
builds the JS entry, uses the tested Wasm files and runs `npm run release:pack`.

The `release-candidate` artifact contains nine `.tgz` files, `manifest.json`
and `SHA256SUMS`. The manifest records the source commit/run, names, versions,
file sizes, SHA-256 and npm-style SHA-512 integrity. Platform package contents,
OS/CPU/libc restrictions and exact optional-dependency versions must match.

The workflow has read-only repository permissions and no OIDC publishing
permission. It runs on manual dispatch or a `verify/release-*` branch. A passing
run does not publish, merge, tag or release anything.

To assemble already-downloaded artifacts locally, preserve the action's
per-artifact folders under `target/release-artifacts/`, build the main package's
JS/Wasm, and use an empty output directory:

```sh
npm run release:pack -- target/release-artifacts target/release-candidate
```

Missing platform tarballs cause failure before assembling a candidate. Local
assembly alone does not replace the real-machine CI tests.

## Future publication, only after separate authorization

The following steps are deliberately **not executed** during preparation:

1. Check package ownership and version availability again. Authenticate to npm
   interactively; do not put credentials into committed files.
2. Use the pinned azu CLI without `--dry-run` for each package above, publishing
   only the `0.0.0` placeholder. That is already a registry publication and needs
   authorization, even though it contains no library implementation.
3. Configure a GitHub trusted publisher for each package on npmjs.com using
   owner `jp-knj`, repository `html-escape` and workflow filename `release.yml`.
   Configure it only when ready for the real publication: new npm trusted
   publisher configurations currently expire if unused for two days.
4. Add and review the actual publishing job in `release.yml`, using npm CLI
   11.5.1 or newer, Node 22.14.0 or newer and job-scoped `id-token: write`.
   The current workflow intentionally contains no such job.
5. Publish the eight tested platform tarballs at `0.1.0` first, verify registry
   availability, then publish the main tarball at that exact version. Install
   from the registry and verify the native import before making a release tag
   and GitHub Release. Do not overwrite an already published version.

The candidate hashes and successful source commit must still match at the time
of publication. The azu placeholder is not a substitute for these real tarballs.

References: [azu's CLI](https://github.com/azu/setup-npm-trusted-publish),
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).
