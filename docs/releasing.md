# Releasing escapex

The first escapex version is `0.0.1`, with eight optional packages named
`escapex-<platform>` at the same version. The packaged [USAGE.md](../USAGE.md)
documents the APIs and migration from `@jp-knj/html-escape`.

Release preparation ends with a verified candidate, release notes and a handoff.
It does **not** register npm packages, publish placeholders or library packages,
configure Trusted Publishers, create tags/releases or deprecate old packages.
The existing `v0.0.1` tag and release belong to the former package name and must
be kept. Future tags are `escapex-v<version>`; do not create one during preparation.

## Build and verify a candidate

Commit the final source to `main`, then dispatch **Release** explicitly without
publication:

```sh
gh workflow run release.yml --repo jp-knj/escapex --ref main -f publish=false
gh run list --repo jp-knj/escapex --workflow release.yml --event workflow_dispatch --limit 5
gh run view RUN_ID --repo jp-knj/escapex
gh run download RUN_ID --repo jp-knj/escapex --name release-candidate --dir target/release-candidate
npm run release:publish -- --dry-run target/release-candidate
```

Use a new or empty download directory. Check that the run succeeded, its
`head_sha` equals the final main commit and its manifest records the same SHA
and run ID. The workflow also supports `verify/release-*` branches for development;
the handoff candidate must come from final `main`.

CI and Native cover Node 22/24/26, eight native platforms, SIMD instructions,
Workers, TypeScript declarations, browser/SSR bundles and Chromium/Firefox/WebKit.
Assembly uses native and Wasm artifacts from that same run and builds the main
JavaScript package. It then installs the **assembled tarballs** with npm and
reruns package, type, documentation, native and browser checks against them.

The `release-candidate` artifact contains nine tarballs, `manifest.json` and
`SHA256SUMS`. The manifest records the source commit/run, versions, sizes,
SHA-256 and npm-style SHA-512 integrity. Assembly checks platform restrictions,
exact package contents and optional-dependency versions. Publication dry-run
validates all archives and the checksum file without registry requests.

For local assembly, keep downloaded native folders named `native-<target>`,
build main JS/Wasm first and use an empty output directory:

```sh
npm run release:pack -- target/release-artifacts target/release-candidate
npm run release:publish -- --dry-run target/release-candidate
RELEASE_CANDIDATE_DIR=target/release-candidate npm run test:candidate
RELEASE_CANDIDATE_DIR=target/release-candidate npm run test:browser
```

Local assembly needs `GITHUB_SHA` and `GITHUB_RUN_ID` from the source run for
manifest provenance. For a release, use the workflow-produced artifact. Archive
the final commit SHA, successful run ID/URL, artifact ID/location, manifest,
checksums and verification results with the handoff. Release notes are in
[CHANGELOG.md](../CHANGELOG.md). Any later source change requires a new candidate.

## Initial npm setup (later publication only)

The pinned tool is [setup-npm-trusted-publish 2.2.0](https://github.com/azu/setup-npm-trusted-publish)
by azu. Preview all nine packages without publishing:

```sh
npm run release:setup
```

For initial publication, authenticate interactively with npm and run:

```sh
npm run release:bootstrap -- --publish-placeholders
```

This explicitly publishes administrative `0.0.0` placeholders for the eight
platform packages and `escapex`. They contain no library implementation.
It uses the installed, pinned azu CLI and saves the package list to
`target/release-setup/packages.txt`. Keep credentials in the npm authentication
flow; do not put them in this repository.

Configure a trusted publisher for every package using GitHub repository
`jp-knj/escapex`, workflow filename `release.yml`, no environment name,
and permission for direct `npm publish`. Use each package's access settings
on npmjs.com, or npm 11.15.0 or newer:

```sh
while IFS= read -r package; do
  npm trust github "$package" --repo jp-knj/escapex --file release.yml --allow-publish --yes
  sleep 2
done < target/release-setup/packages.txt
```

This may require interactive two-factor authentication. If a relationship
already exists, inspect it with `npm trust list <package>` rather than replacing
it blindly. Complete setup close to the first real publication.

## Publish the verified candidate (later publication only)

Make `main` point to the exact successful candidate commit. Any source change
requires a new candidate. Dispatch **Release** on `main` with `publish=true`
and the successful candidate workflow run ID:

```sh
gh workflow run release.yml --repo jp-knj/escapex --ref main -f publish=true -f candidate_run_id=RUN_ID
```

The publishing job downloads that existing artifact without rebuilding it.
It uses pinned npm 11.21.2 and GitHub OIDC with job-scoped permissions. Before
any npm write, it verifies archive order, sizes, both hashes, names, versions,
and main-package metadata. It also checks the exact main commit and successful
candidate run in this repository's `release.yml` workflow.

Native packages are published first, then the main package, at matching versions
with the `latest` tag and provenance. Every registry integrity is checked.
Retries skip identical versions and reject conflicting bytes. Progress is saved
in `publication.json` without changing the candidate manifest.

The job installs the main package from npm and verifies its native import.
Only after success does it create `escapex-v<version>` and a GitHub Release containing
the tested tarballs, manifest and checksums. A verification branch cannot publish.

References: [azu's CLI](https://github.com/azu/setup-npm-trusted-publish),
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/),
[npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
