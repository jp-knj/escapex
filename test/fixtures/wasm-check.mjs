const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '\r': '&#13;', '\n': '&#10;' };
const patterns = { html: /[&<>'"]/g, text: /[&<>]/g, attribute: /[&<>'"\r\n]/g };

// Shared by Node and all three real browser engines; no Node APIs.
export function verifyEscape(escapeHTML, mode = 'html') {
	let count = 0;
	const check = (input) => {
		const expected = input.replace(patterns[mode], (char) => entities[char]);
		if (escapeHTML(input) !== expected) throw new Error(`${mode} mismatch: ${JSON.stringify(input.slice(0, 80))}`);
		count++;
	};
	for (const input of ['', 'plain', '&<>\'"', '&amp;&lt;&#39;', '\ufeff&', '&\ufeff', '\ufffe&',
		'日本語 😀\0\ud800&\udfff', '\ud800&', '\udfff&', '\ud800\ud800&', '😀&',
		'\r', '\n', '\r\n', '\t\r\n', '\'"\r\n', '&#13;&#10;', 'one\r\ntwo\rthree\nfour']) check(input);
	// Force entry into Wasm even for code units which do not themselves need escaping.
	for (let code = 0; code <= 0xffff; code++) {
		const lane = code % 8;
		check('a'.repeat(lane) + String.fromCharCode(code) + 'a'.repeat(15 - lane) + '&');
	}
	for (const length of [0, 1, 7, 8, 9, 15, 16, 17, 255, 256, 257, 16383, 16384, 16385, 65535, 65536]) {
		for (const fill of ['a', '\ud800', '\udfff', '"', '\r', '\n']) {
			for (const pos of [0, Math.floor(length / 2), length]) check(fill.repeat(pos) + '&' + fill.repeat(length - pos));
		}
	}
	let seed = 0x12345678;
	const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
	for (let sample = 0; sample < 5000; sample++) {
		let input = '';
		const length = random() % 512;
		for (let index = 0; index < length; index++) {
			const n = random();
			input += n % 4 === 0 ? '&<>\'"\r\n'[n % 7] : String.fromCharCode(n & 0xffff);
		}
		check(input);
	}
	for (const input of ['a'.repeat(1024 * 1024) + '&', '"'.repeat(1024 * 1024), '&after growth\ud800']) check(input);
	let coerced = false;
	for (const input of [null, undefined, 1, true, 1n, Symbol(), [], {}, new String('&'),
		{ toString() { coerced = true; return '&'; } }]) {
		let failed = false;
		try { escapeHTML(input); } catch (error) { failed = error instanceof TypeError; }
		if (!failed) throw new Error('Expected TypeError');
	}
	if (coerced) throw new Error('Input was coerced');
	return count;
}

export function verifyContexts({ escapeText, escapeAttribute }) {
	return verifyEscape(escapeText, 'text') + verifyEscape(escapeAttribute, 'attribute');
}
