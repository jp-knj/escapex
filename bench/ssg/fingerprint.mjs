import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function fingerprint() {
	const files = ['rust/src/escape.rs', 'rust/src/native_escape.rs', 'rust/src/native.rs', 'rust/Cargo.toml', 'rust/Cargo.lock',
		'bench/ssg/expected-inputs.json', 'bench/ssg/cost.mjs', 'bench/ssg/cost-worker.mjs', 'bench/ssg/capture-inputs.mjs', 'bench/ssg/tuning.mjs',
		'bench/ssg/select-before.mjs', 'bench/ssg/fingerprint.mjs', 'bench/ssg/prepare-before.mjs', 'bench/ssg/micro.mjs',
		'bench/competitors/worker.mjs', 'bench/competitors/cases.mjs',
		'bench/ssg/adapter.mjs', 'bench/ssg/bootstrap.mjs', 'bench/ssg/integration.mjs', 'bench/ssg/output.mjs', 'bench/ssg/profile.mjs',
		'bench/astro/ssg-site/astro.config.mjs', 'bench/astro/ssg-site/src/pages/[page].astro',
		'bench/astro/ssg-site/src/components/Article.md', 'bench/astro/package-lock.json', 'bench/competitors/package-lock.json'];
	for (const dir of ['dist', 'target/ssg-tuning/before-api']) {
		files.push(`${dir}/native.mjs`, `${dir}/escape-core.mjs`);
		for (const file of await readdir(new URL(`../../${dir}/native/`, import.meta.url))) {
			if (file.endsWith('.node')) files.push(`${dir}/native/${file}`);
		}
	}
	return Object.fromEntries(await Promise.all(files.map(async file => [file,
		createHash('sha256').update(await readFile(new URL('../../' + file, import.meta.url))).digest('hex')])));
}
