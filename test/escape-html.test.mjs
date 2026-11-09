import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escape as referenceEscape, unescape as referenceUnescape } from 'html-escaper';
import * as api from '../dist/index.mjs';
import { verifyEscape, verifyContexts } from './fixtures/wasm-check.mjs';
import { verifyUnescape } from './fixtures/unescape-check.mjs';

test('ESM: UTF-16, boundary, large input and type contract', () => {
	assert.equal(api.escape, api.escapeHTML);
	assert.equal(api.unescape, api.unescapeHTML);
	assert(verifyEscape(api.escape) > 70000);
	assert(verifyContexts(api) > 140000);
	assert(verifyUnescape(api) > 65000);
});

test('ESM: matches html-escaper for string inputs, including malformed references', () => {
	let seed = 0x12345678;
	const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
	const pieces = ['&amp;', '&#38;', '&lt;', '&#60;', '&gt;', '&#62;', '&apos;', '&#39;', '&quot;', '&#34;',
		'&amp;lt;', '&AMP;', '&#x26;', '&#038;', '&nbsp;', '&lt', '&', '&&amp;', '\0', '\ud800', '\udfff', '😀'];
	for (let sample = 0; sample < 5000; sample++) {
		let input = '';
		for (let i = 0, n = random() % 64; i < n; i++) input += pieces[random() % pieces.length];
		assert.equal(api.escape(input), referenceEscape(input));
		assert.equal(api.unescape(input), referenceUnescape(input));
	}
});
