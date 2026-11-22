// Literal expectations keep this oracle independent of the runtime scanners.
// Columns are input, HTML, text, and quoted attribute output.
const alphabet = [
	['&', '&amp;', '&amp;', '&amp;'],
	['<', '&lt;', '&lt;', '&lt;'],
	['>', '&gt;', '&gt;', '&gt;'],
	["'", '&#39;', "'", '&#39;'],
	['"', '&quot;', '"', '&quot;'],
	['\r', '\r', '\r', '&#13;'],
	['\n', '\n', '\n', '&#10;'],
	['a', 'a', 'a', 'a'],
	['\0', '\0', '\0', '\0'],
	['\ud800', '\ud800', '\ud800', '\ud800'],
	['\udfff', '\udfff', '\udfff', '\udfff'],
];
const operations = ['escapeHTML', 'escapeText', 'escapeAttribute'];

// Browser-safe: the same cases run against ESM, native, both Wasm variants,
// installed-package bundles, and all three browser engines.
export function verifyContextRegressions(api) {
	let count = 0;
	const equal = (actual, expected, label) => {
		if (actual !== expected) throw new Error(`${label}: ${JSON.stringify(actual.slice(0, 80))} !== ${JSON.stringify(expected.slice(0, 80))}`);
		count++;
	};
	const check = (input, expected) => {
		for (let mode = 0; mode < operations.length; mode++) {
			const operation = operations[mode];
			equal(api[operation](input), expected[mode], `${operation} ${JSON.stringify(input.slice(0, 80))}`);
		}
	};

	// Exhaust every string of up to four units in this alphabet: 16,105 strings,
	// including adjacent targets, clean gaps, CR/LF and every surrogate ordering.
	const visit = (input, expected, depth) => {
		check(input, expected);
		if (depth === 4) return;
		for (const row of alphabet) {
			visit(input + row[0], expected.map((value, mode) => value + row[mode + 1]), depth + 1);
		}
	};
	visit('', ['', '', ''], 0);

	// Escaping must commute with concatenation, including splits inside a
	// surrogate pair, CRLF, or a run. Compare concatenated results with literal
	// output, rather than using another implementation as the source of truth.
	const boundaries = [0, 1, 2, 3, 4, 15, 16, 31, 32, 127, 128, 255, 256, 16383, 16384, 16385];
	const cleanPattern = 'a\u00a0\ufeff\u2028\u2029😀\0';
	for (const length of boundaries) {
		const clean = cleanPattern.repeat(Math.ceil(length / cleanPattern.length)).slice(0, length);
		const input = '&<' + clean + '"\r\n\ud800\udfff\0>';
		const expected = [
			'&amp;&lt;' + clean + '&quot;\r\n\ud800\udfff\0&gt;',
			'&amp;&lt;' + clean + '"\r\n\ud800\udfff\0&gt;',
			'&amp;&lt;' + clean + '&quot;&#13;&#10;\ud800\udfff\0&gt;',
		];
		check(input, expected);
		const splits = new Set([
			...boundaries.flatMap((at) => [at - 1, at, at + 1]),
			...Array.from({ length: 8 }, (_, offset) => input.length - offset),
		]);
		for (const split of splits) {
			if (split < 0 || split > input.length) continue;
			for (let mode = 0; mode < operations.length; mode++) {
				const operation = operations[mode];
				equal(api[operation](input.slice(0, split)) + api[operation](input.slice(split)),
					expected[mode], `${operation} concatenation at ${split}/${input.length}`);
			}
		}
	}

	let touched = false;
	const touch = () => { touched = true; throw new Error('Input was inspected or coerced'); };
	const revoked = Proxy.revocable({}, {});
	revoked.revoke();
	const invalid = [undefined, null, 0, NaN, false, 1n, Symbol('input'), [], {},
		new String('&'), Object.create(null), () => '&', { [Symbol.toPrimitive]: touch },
		{ toString: touch, valueOf: touch }, new Proxy({}, { get: touch }), revoked.proxy];
	const mixed = '&<>\'"\r\n\ud800';
	const mixedExpected = [
		'&amp;&lt;&gt;&#39;&quot;\r\n\ud800',
		'&amp;&lt;&gt;\'"\r\n\ud800',
		'&amp;&lt;&gt;&#39;&quot;&#13;&#10;\ud800',
	];
	for (const input of invalid) {
		for (const operation of operations) {
			check(mixed, mixedExpected);
			let rejected = false;
			try { api[operation](input); } catch (error) { rejected = error instanceof TypeError; }
			if (!rejected) throw new Error(`${operation}: expected TypeError`);
			count++;
			// Exercise the same entry again immediately after failure, then switch
			// APIs and alternate successful, empty, and unchanged inputs.
			equal(api[operation]('&'), '&amp;', `${operation} after rejection`);
			check('', ['', '', '']);
			check('plain\u00a0\ufeff\0', Array(3).fill('plain\u00a0\ufeff\0'));
			check(mixed, mixedExpected);
		}
	}
	if (touched) throw new Error('An invalid input was inspected or coerced');
	return count;
}
