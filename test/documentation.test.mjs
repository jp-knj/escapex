import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { preparePackage } from '../scripts/package-fixture.mjs';

let fixture;
before(async () => { fixture = await preparePackage(); });
after(async () => { if (fixture) await rm(fixture.consumer, { recursive: true, force: true }); });
const run = code => execFileSync(process.execPath, ['--input-type=module', '-e', code],
	{ cwd: fixture.consumer, stdio: 'pipe' });
const snippets = text => [...text.matchAll(/```js\n([\s\S]*?)```/g)].map(match => match[1]);

test('installed README example renders HTML text and quoted attributes', async () => {
	const [example] = snippets(await readFile(join(fixture.installed, 'README.md'), 'utf8'));
	run(example + `\nimport assert from 'node:assert/strict';
assert.equal(html, '<p title="Say &quot;hello&quot;">Tea &amp; &lt;toast&gt;</p>');`);
});

test('installed usage examples: API contracts, SSR, SSG, double escaping and Wasm', async () => {
	const examples = snippets(await readFile(join(fixture.installed, 'USAGE.md'), 'utf8'));
	assert.equal(examples.length, 6);
	const [api, renderer, ssg, doubleEscape, , wasm] = examples;
	run(api + `\nimport assert from 'node:assert/strict';
assert.equal(escapeHTML('A < B & "quoted"'), 'A &lt; B &amp; &quot;quoted&quot;');
assert.equal(escapeText('A < B & "quoted"'), 'A &lt; B &amp; "quoted"');
assert.equal(escapeAttribute('one\\r\\ntwo'), 'one&#13;&#10;two');
assert.equal(unescapeHTML('&amp;lt;'), '&lt;');`);
	const expected = '<article title="Say &quot;hello&quot;&#13;&#10;Next line"><h2>Tea &amp; &lt;toast&gt;</h2></article>';
	run(renderer + `\nimport assert from 'node:assert/strict'; assert.equal(html, ${JSON.stringify(expected)});`);
	await writeFile(join(fixture.consumer, 'render-card.mjs'), renderer);
	run(ssg);
	assert.equal(await readFile(join(fixture.consumer, 'card.html'), 'utf8'), expected);
	run(doubleEscape + `\nimport assert from 'node:assert/strict';
assert.equal(escapeText(escapeText('Tea & toast')), 'Tea &amp;amp; toast');`);
	run(wasm + `\nimport assert from 'node:assert/strict';
assert.equal(escapeHTML('日本語 😀 <text>'), '日本語 😀 &lt;text&gt;');`);
});
