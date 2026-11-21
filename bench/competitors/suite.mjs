import assert from 'node:assert/strict';

export const operations = ['escapeHTML', 'escapeText', 'escapeAttribute'];
export const variants = ['esm', 'wasm', 'native', 'escape-html', 'fast-escape-html', 'html-escaper', '@napi-rs/escape'];

export function options(env = process.env) {
	const operation = env.BENCH_OPERATION ?? 'escapeHTML';
	assert(operations.includes(operation), 'Unknown BENCH_OPERATION');
	const available = operation === 'escapeHTML' ? variants : variants.slice(0, 3);
	const selected = env.BENCH_VARIANTS?.split(',') ?? available;
	assert(selected.length > 0 && new Set(selected).size === selected.length
		&& selected.every(value => available.includes(value)), `Unknown, repeated or unsupported BENCH_VARIANTS entry for ${operation}`);
	const rounds = Number(env.BENCH_ROUNDS ?? selected.length);
	assert(Number.isInteger(rounds) && rounds >= 3, 'BENCH_ROUNDS must be an integer >= 3');
	return { operation, variants: selected, rounds };
}

// Independent oracle: context APIs must not be compared with full HTML escaping.
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '\r': '&#13;', '\n': '&#10;' };
const patterns = { escapeHTML: /[&<>'"]/g, escapeText: /[&<>]/g, escapeAttribute: /[&<>'"\r\n]/g };
export function reference(operation, value) {
	assert(operations.includes(operation), 'Unknown operation');
	return value.replace(patterns[operation], char => entities[char]);
}
