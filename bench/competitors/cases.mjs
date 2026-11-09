export const cases = {
	short: 'A < B & "quoted"',
	'unchanged-16': 'abcdefghijklmnop',
	'first-16': '<abcdefghijklmno',
	'first-31': '<' + 'a'.repeat(30),
	'first-32': '<' + 'a'.repeat(31),
	'dense-31': '&<>"'.repeat(7) + '&<>',
	'unchanged-short': 'plain text without special characters',
	'unchanged-long': 'plain text without special characters '.repeat(4096),
	'quoted-json': JSON.stringify(Array.from({ length: 512 }, (_, id) => ({ id, title: 'item "title"', html: '<a href="/">&</a>' }))),
	'japanese-emoji': '日本語と絵文字😀 <span title="引用">本文 & 続き</span>\r\n'.repeat(1024),
	'long-body': ('a paragraph without markup '.repeat(100) + '<a href="/a?x=1&y=2">link</a>\n').repeat(128),
	'dense-quotes': '\'"&<>\r\n'.repeat(4096),
};

// Additional cases were selected after the candidate screen, before measuring the
// production implementation. The mixed pools change inputs on every timed call.
Object.assign(cases, {
 'first-24': '<' + 'a'.repeat(23),
 'last-31': 'a'.repeat(30) + '&',
 'two-near-31': '<&' + 'a'.repeat(29),
 'two-far-31': '<' + 'a'.repeat(29) + '&',
 'dense-32': '&<>"'.repeat(8),
 'dense-255': '&<>"'.repeat(63) + '&<>',
 'first-255': '<' + 'a'.repeat(254),
 'first-256': '<' + 'a'.repeat(255),
 'spaced-8': ('a'.repeat(7) + '&').repeat(128),
 'spaced-32': ('a'.repeat(31) + '&').repeat(32),
 'sparse-8192': '<' + 'a'.repeat(8190) + '>',
});
cases['mixed-short'] = [8, 16, 17, 24, 31, 32, 64, 127, 255].flatMap(length => [
 'a'.repeat(length),
 '<' + 'b'.repeat(length - 1),
 'c'.repeat(length - 1) + '&',
 '日本😀<&"'.repeat(Math.max(1, Math.floor(length / 8))),
]);
cases['mixed-long'] = [256, 1024, 8192, 16384].flatMap(length => [
 'a'.repeat(length),
 '<' + 'b'.repeat(length - 1),
 '<&' + 'c'.repeat(length - 2),
 'd'.repeat(length - 1) + '&',
 ('e'.repeat(31) + '&').repeat(length / 32),
 '&<>"'.repeat(length / 4),
]);
