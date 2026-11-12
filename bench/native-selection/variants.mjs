import assert from 'node:assert/strict';

// All candidates start from the frozen public API, not from another candidate.
function replace(source, before, after) {
	assert.equal(source.split(before).length, 2, `Expected one occurrence: ${before}`);
	return source.replace(before, after);
}

export function candidate(source, { tail = false, expanded = false } = {}) {
	if (tail) source = replace(source,
		'if (nearby >= 8) return binding.escapeHtml(value);',
		`if (nearby >= 8) {
			if (index === value.length - 1) return output + value.slice(last, index) + HTML_ENTITIES[value.charCodeAt(index)];
			return binding.escapeHtml(value);
		}`);
	if (expanded) {
		source = replace(source, 'const HTML_NATIVE_MIN_LENGTH = 128;', `const HTML_NATIVE_MIN_LENGTH = 128;
const HTML_SAMPLE = /[&<>'"]/g;

// Sample only additional native candidates. Existing nearby runs take priority.
function distributedHTML(value: string): boolean {
	for (let quarter = 1; quarter <= 3; quarter++) {
		const start = Math.floor(value.length * quarter / 4);
		const sample = value.slice(start, start + 128);
		HTML_SAMPLE.lastIndex = 0;
		for (let count = 0; count < 4; count++) {
			if (!HTML_SAMPLE.test(sample)) return false;
		}
	}
	return true;
}`);
		source = replace(source, 'let nearby = 1;', `let nearby = 1;
	let widerNearby = 1;
	let sampled = value.length < 4096;`);
		source = replace(source, '\t\tif (last !== index) output += value.slice(last, index);', `		if (!sampled && index < value.length / 4) {
			widerNearby = index - last < 32 ? widerNearby + 1 : 1;
			if (widerNearby >= 8) {
				sampled = true;
				if (distributedHTML(value)) return binding.escapeHtml(value);
			}
		}
		if (last !== index) output += value.slice(last, index);`);
	}
	return source;
}
