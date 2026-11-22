import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as api from '../dist/index.mjs';

// Keep these small, literal-output checks separate from exhaustive fixtures.
// Stryker runs this file first and stops if it fails. In particular, reversed
// loop conditions must fail on two targets before a single-target call can hang.
test('ESM contract: HTML scanning preserves targets, gaps, and suffixes', () => {
	assert.equal(api.escapeHTML('&&'), '&amp;&amp;', 'both targets in a short input');
	assert.equal(api.escapeHTML('&' + 'x'.repeat(15) + '&'),
		'&amp;' + 'x'.repeat(15) + '&amp;', 'both targets beyond the short-input boundary');

	for (const length of [2, 15, 16, 17, 31, 32, 33, 127, 128, 129, 255, 256, 257]) {
		for (const at of new Set([0, Math.floor((length - 2) / 2), length - 2])) {
			const prefix = '\ud800'.repeat(at);
			const suffix = '\udfff'.repeat(length - at - 2);
			assert.equal(api.escapeHTML(prefix + '<"' + suffix), prefix + '&lt;&quot;' + suffix,
				`two targets at ${at}/${length}, with unpaired surrogates preserved`);
		}
	}
	for (const gap of [0, 1, 3, 4, 7, 8, 9, 15, 16, 17, 31, 32, 33]) {
		for (const tail of [0, 1, 15, 16, 17, 31, 32, 33, 128]) {
			const prefix = 'p'.repeat(128);
			const middle = '\0'.repeat(gap);
			const suffix = '😀'.repeat(tail);
			const input = prefix + '&' + middle + '<>\'"' + suffix;
			const expected = prefix + '&amp;' + middle + '&lt;&gt;&#39;&quot;' + suffix;
			assert.equal(api.escapeHTML(input), expected, `HTML gap=${gap}, suffix=${tail}`);
			assert.equal(api.escapeHTML('clean\0😀'), 'clean\0😀', 'no-match call after a long scan');
			assert.equal(api.escapeHTML('&&'), '&amp;&amp;', 'short call after a long scan');
		}
	}
	const neighbors = '!#$%()*+,-./0123456789:;=?@[]^_`{|}~\r\n\u0100\uffff';
	assert.equal(api.escapeHTML('&' + neighbors + '<'), '&amp;' + neighbors + '&lt;',
		'characters next to target ASCII codes are preserved');
});

test('ESM contract: text preserves quotes and line breaks around escaped runs', () => {
	for (const gap of ['', 'a', 'abc', 'abcd', '\0', '\ud800', '\udfff', '😀']) {
		const input = '&<' + gap + '\'"\r\n>';
		const expected = '&amp;&lt;' + gap + '\'"\r\n&gt;';
		assert.equal(api.escapeText(input), expected, `text run interrupted by ${JSON.stringify(gap)}`);
		assert.equal(api.escapeText('\'"\r\n'), '\'"\r\n', 'text-only preserved characters');
		assert.equal(api.escapeText('&&'), '&amp;&amp;', 'text regexp state is reset');
	}
	assert.equal(api.escapeText('&amp;lt;'), '&amp;amp;lt;', 'existing references are escaped again');
	assert.equal(api.escapeText(''), '');
});

test('ESM contract: attributes encode each quote and line-break code unit', () => {
	for (const gap of ['', 'a', 'abc', 'abcd', '\0', '\ud800', '\udfff', '😀']) {
		const input = '&<' + gap + '\'"\r\n>\n\r';
		const expected = '&amp;&lt;' + gap + '&#39;&quot;&#13;&#10;&gt;&#10;&#13;';
		assert.equal(api.escapeAttribute(input), expected, `attribute run interrupted by ${JSON.stringify(gap)}`);
		assert.equal(api.escapeAttribute('plain\t\u2028\u2029'), 'plain\t\u2028\u2029', 'other whitespace is preserved');
		assert.equal(api.escapeAttribute('\r\n'), '&#13;&#10;', 'attribute regexp state is reset');
	}
	assert.equal(api.escapeAttribute('&#13;&#10;'), '&amp;#13;&amp;#10;', 'existing references are escaped again');
	assert.equal(api.escapeAttribute(''), '');
});

test('ESM contract: decoding is case-sensitive, exact, and single-pass', () => {
	for (const [encoded, decoded] of [
		['&amp;', '&'], ['&#38;', '&'], ['&lt;', '<'], ['&#60;', '<'], ['&gt;', '>'], ['&#62;', '>'],
		['&apos;', "'"], ['&#39;', "'"], ['&quot;', '"'], ['&#34;', '"'],
	]) {
		const input = '\ud800' + encoded + '\0' + encoded + '\udfff';
		const expected = '\ud800' + decoded + '\0' + decoded + '\udfff';
		assert.equal(api.unescape(input), expected, `two ${encoded} references with exact UTF-16 preservation`);
		assert.equal(api.unescape(encoded.slice(0, -1)), encoded.slice(0, -1), 'semicolon is required');
		assert.equal(api.unescape(encoded), decoded, 'decoding regexp state is reset');
	}
	for (const [input, expected] of [
		['&amp;amp;lt;', '&amp;lt;'], ['&#38;#38;lt;', '&#38;lt;'],
		['&amp;#x26;', '&#x26;'], ['&&amp;;', '&&;'],
		['&am&lt;p;', '&am<p;'], ['&#3&amp;8;', '&#3&8;'],
	]) assert.equal(api.unescape(input), expected, `one decoding pass over ${input}`);
	for (const input of [
		'&AMP;', '&Amp;', '&LT;', '&APOS;', '&QUOT;', '&nbsp;', '&quote;',
		'&#038;', '&#00038;', '&#+38;', '&#-38;', '&# 38;', '&#38 ;',
		'&#x26;', '&#X26;', '&#x3c;', '&#13;', '&#10;', '&#３８;', '&am\0p;',
	]) assert.equal(api.unescape(input), input, `unsupported reference ${JSON.stringify(input)}`);
	assert.equal(api.unescape(''), '');
});
