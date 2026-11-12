export const cases = {};
export const methods = {};
for (const method of ['escapeText', 'escapeAttribute']) {
	for (const [kind, value] of Object.entries({
		'unchanged': '日本語😀plain'.repeat(1024),
		'dense-256': '&<\r\n\'"'.repeat(43).slice(0, 256),
		'dense-8192': '&<\r\n\'"'.repeat(1366).slice(0, 8192),
		'sparse-8192': 'a'.repeat(4095) + '&' + 'a'.repeat(4096),
		'unicode-8192': '日本語😀\ud800&\udfff'.repeat(1024),
		'mixed-sizes': [0, 1, 128, 255, 256, 4096, 8192, 16384].map(length => '&<日本語😀\ud800'.repeat(Math.ceil(length / 9)).slice(0, length)),
	})) {
		const name = `${method}-${kind}`;
		cases[name] = value;
		methods[name] = method;
	}
}
