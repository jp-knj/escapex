const examples = [
	['', ''], ['plain', 'plain'],
	['&amp;&#38;&lt;&#60;&gt;&#62;&apos;&#39;&quot;&#34;', '&&<<>>\'\'""'],
	['&amp;lt;&amp;#39;&amp;amp;', '&lt;&#39;&amp;'],
	['&AMP;&LT;&#x26;&#038;&nbsp;&copy;&amp;&lt', '&AMP;&LT;&#x26;&#038;&nbsp;&copy;&&lt'],
	['&&amp;;', '&&;'], ['\ufeff&amp;\0\ud800&quote;\udfff', '\ufeff&\0\ud800&quote;\udfff'],
];

export function verifyUnescape({ escape, unescape }) {
	let count = 0;
	const check = (input, expected) => {
		if (unescape(input) !== expected) throw new Error(`Decode mismatch: ${JSON.stringify(input.slice(0, 80))}`);
		count++;
	};
	for (const [input, expected] of examples) check(input, expected);
	for (let code = 0; code <= 0xffff; code++) {
		const value = String.fromCharCode(code);
		check(`&amp;${value}&lt;`, `&${value}<`);
	}
	for (const n of [7, 8, 15, 16, 255, 256, 16383, 16384, 16385, 65536]) {
		const value = '&日本語😀\ud800\0'.repeat(n);
		check(escape(value), value);
	}
	check('&quot;'.repeat(1024 * 1024), '"'.repeat(1024 * 1024));
	check('&amp;after growth', '&after growth');
	let coerced = false;
	for (const input of [undefined, null, 1, true, 1n, Symbol(), {}, [], new String('&'),
		{ toString() { coerced = true; return '&amp;'; } }]) {
		let rejected = false;
		try { unescape(input); } catch (error) { rejected = error instanceof TypeError; }
		if (!rejected) throw new Error('Expected TypeError');
	}
	if (coerced) throw new Error('Input was coerced');
	return count;
}
