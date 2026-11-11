import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export async function hashOutput(directory) {
	const files = [];
	async function visit(relative = '') {
		for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
			const path = relative ? `${relative}/${entry.name}` : entry.name;
			if (entry.isDirectory()) await visit(path);
			else files.push(path);
		}
	}
	await visit();
	const hash = createHash('sha256');
	let bytes = 0;
	for (const file of files.sort()) {
		const body = await readFile(join(directory, file));
		hash.update(file).update('\0').update(String(body.length)).update('\0').update(body);
		bytes += body.length;
	}
	return { sha256: hash.digest('hex'), files: files.length, htmlFiles: files.filter(f => f.endsWith('.html')).length, bytes };
}
