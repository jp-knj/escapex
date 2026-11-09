# Releasing html-escape

The first functional version is `0.0.1`. The root README remains `# html-escape`;
the packaged [USAGE.md](../USAGE.md) documents the APIs.

## Initial npm setup

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
platform packages and `@jp-knj/html-escape`. They contain no library implementation.
It uses the installed, pinned azu CLI and saves the package list to
`target/release-setup/packages.txt`. Keep credentials in the npm authentication
flow; do not put them in this repository.

Configure a trusted publisher for every package using GitHub repository
`jp-knj/html-escape`, workflow filename `release.yml`, no environment name,
and permission for direct `npm publish`. Use each package's access settings
on npmjs.com, or npm 11.15.0 or newer:

```sh
while IFS= read -r package; do
  npm trust github "$package" --repo jp-knj/html-escape --file release.yml --allow-publish --yes
  sleep 2
done < target/release-setup/packages.txt
```

This may require interactive two-factor authentication. If a relationship
already exists, inspect it with `npm trust list <package>` rather than replacing
it blindly. Complete setup close to the first real publication.

## Build and verify a candidate

The **Release** workflow runs on a `verify/release-*` branch or manual dispatch
with `publish=false`. It calls CI and Native, covering Node 22/24/26, eight native
platforms, SIMD instructions, npm tarballs, Workers and browsers. After success,
assembly uses native and Wasm artifacts from that same run and builds the main
JavaScript package.

The `release-candidate` artifact contains nine tarballs, `manifest.json` and
`SHA256SUMS`. The manifest records the source commit/run, versions, sizes,
SHA-256 and npm-style SHA-512 integrity. Assembly checks platform restrictions,
exact package contents and optional-dependency versions. Publication dry-run
then validates all archives without registry requests.

For local assembly or inspection:

```sh
npm run release:pack -- target/release-artifacts target/release-candidate
npm run release:publish -- --dry-run target/release-candidate
```

Keep downloaded native folders named `native-<target>`. Build main JS/Wasm first,
and use a new or empty output directory.

## Publish the verified candidate

Make `main` point to the exact successful candidate commit. Any source change
requires a new candidate. Dispatch **Release** on `main` with `publish=true`
and the successful candidate workflow run ID:

```sh
gh workflow run release.yml --ref main -f publish=true -f candidate_run_id=RUN_ID
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
Only after success does it create `v<version>` and a GitHub Release containing
the tested tarballs, manifest and checksums. A verification branch cannot publish.

References: [azu's CLI](https://github.com/azu/setup-npm-trusted-publish),
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/),
[npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
