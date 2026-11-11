import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, release } from 'node:os';
import { targets } from './native-targets.mjs';

const rust = execFileSync('rustc', ['-vV'], { encoding: 'utf8' });
const triple = rust.match(/^host: (.+)$/m)[1].trim();
const target = targets.find((entry) => entry.triple === triple);
assert(target, `Unknown Rust host: ${triple}`);
assert.equal(process.arch, target.cpu, 'Node and Rust must use the same native architecture');
assert.equal(process.platform, target.os);
if (process.env.NATIVE_PLATFORM) assert.equal(target.id, process.env.NATIVE_PLATFORM);
if (target.libc) {
	const libc = process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl';
	assert.equal(libc, target.libc);
}
const data = { target: target.id, triple, platform: process.platform, arch: process.arch,
	os: release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, node: process.version,
	napi: process.versions.napi, rust: rust.trim(), commit: process.env.GITHUB_SHA,
	runUrl: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : undefined,
	runnerImage: process.env.ImageOS, runnerImageVersion: process.env.ImageVersion };
mkdirSync(new URL('../target/', import.meta.url), { recursive: true });
writeFileSync(new URL('../target/native-environment.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data, null, 2));
