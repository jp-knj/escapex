// Extracted from withastro/astro commit 2637ed10afd26f1f29db673616c6225eb0d848a6.
// Copyright (c) 2021 Fred K. Schott. MIT license; see LICENSE.

const ESCAPABLE = /[&<>'"]/g;
const TEXT = /[&<>]/g;
const ATTRIBUTE = /[&<>'"\r\n]/g;

function entityFor(code: number): string {
	switch (code) {
		case 10:
			return '&#10;';
		case 13:
			return '&#13;';
		case 38:
			return '&amp;';
		case 60:
			return '&lt;';
		case 62:
			return '&gt;';
		case 39:
			return '&#39;';
		default:
			return '&quot;';
	}
}

/** Escapes &, <, >, ', and " in a primitive string for HTML text or quoted attributes. */
export function escapeHTML(value: string): string {
	return encode(value, ESCAPABLE, 'escape');
}

/** Escapes &, < and > for HTML text nodes. Not for script/style contents. */
export function escapeText(value: string): string {
	return encode(value, TEXT, 'escapeText');
}

/**
 * Escapes the five HTML characters and CR/LF for single- or double-quoted
 * plain attribute values. Does not validate URLs, CSS or event handlers.
 */
export function escapeAttribute(value: string): string {
	return encode(value, ATTRIBUTE, 'escapeAttribute');
}

function encode(value: string, pattern: RegExp, operation: string): string {
	if (typeof value !== 'string') throw new TypeError(`${operation} expects a primitive string`);
	pattern.lastIndex = 0;
	if (!pattern.test(value)) return value;
	let output = '';
	let last = 0;
	do {
		const index = pattern.lastIndex - 1;
		if (last !== index) output += value.slice(last, index);
		output += entityFor(value.charCodeAt(index));
		last = index + 1;
	} while (pattern.test(value));
	return last === value.length ? output : output + value.slice(last);
}

export { escapeHTML as escape };
