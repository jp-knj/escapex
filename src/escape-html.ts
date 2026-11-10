// Originally derived from withastro/astro commit 2637ed10afd26f1f29db673616c6225eb0d848a6.
// Copyright (c) 2021 Fred K. Schott. MIT license; see LICENSE.

const ESCAPABLE = /[&<>'"]/g;
const TEXT = /[&<>]/g;
const ATTRIBUTE = /[&<>'"\r\n]/g;
// Indexed only after the five ASCII targets have been identified.
const HTML_ENTITIES: string[] = Array(63).fill('');
HTML_ENTITIES[34] = '&quot;';
HTML_ENTITIES[38] = '&amp;';
HTML_ENTITIES[39] = '&#39;';
HTML_ENTITIES[60] = '&lt;';
HTML_ENTITIES[62] = '&gt;';

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
	if (typeof value !== 'string') throw new TypeError('escape expects a primitive string');
	ESCAPABLE.lastIndex = 0;
	if (!ESCAPABLE.test(value)) return value;
	if (value.length >= 128) return escapeMatchedHTML(value, ESCAPABLE.lastIndex - 1);
	let output = '';
	let last = 0;
	if (value.length <= 16) {
		for (let index = ESCAPABLE.lastIndex - 1; index < value.length; index++) {
			const code = value.charCodeAt(index);
			// Pair '&' with apostrophe, and '<' with '>'; all other UTF-16 values fail.
			if ((code | 1) !== 39 && (code | 2) !== 62 && code !== 34) continue;
			if (last !== index) output += value.slice(last, index);
			output += HTML_ENTITIES[code];
			last = index + 1;
		}
	} else {
		for (let index = ESCAPABLE.lastIndex - 1; index < value.length; index++) {
			const code = value.charCodeAt(index);
			if ((code | 1) !== 39 && (code | 2) !== 62 && code !== 34) {
				// Stop walking a clean suffix; the next iteration consumes the match.
				if (index - last >= 8) {
					ESCAPABLE.lastIndex = index + 1;
					if (!ESCAPABLE.test(value)) return output + value.slice(last);
					index = ESCAPABLE.lastIndex - 2;
				}
				continue;
			}
			if (last !== index) output += value.slice(last, index);
			output += HTML_ENTITIES[code];
			last = index + 1;
		}
	}
	return last === value.length ? output : output + value.slice(last);
}

/** @internal The caller supplies a known HTML match in a primitive string. */
export function escapeMatchedHTML(value: string, firstMatch: number): string {
	ESCAPABLE.lastIndex = firstMatch + 1;
	let output = '';
	let last = 0;
	do {
		let index = ESCAPABLE.lastIndex - 1;
		// Nearby matches amortize character scanning; sparse matches stay in regexp.
		if (last !== 0 && index - last < 16) {
			if (value.length - index <= 32) {
				for (; index < value.length; index++) {
					const code = value.charCodeAt(index);
					if ((code | 1) !== 39 && (code | 2) !== 62 && code !== 34) continue;
					if (last !== index) output += value.slice(last, index);
					output += HTML_ENTITIES[code];
					last = index + 1;
				}
				return last === value.length ? output : output + value.slice(last);
			}
			let end = Math.min(index + 16, value.length);
			for (; index < end; index++) {
				const code = value.charCodeAt(index);
				if ((code | 1) !== 39 && (code | 2) !== 62 && code !== 34) continue;
				if (last !== index) output += value.slice(last, index);
				output += HTML_ENTITIES[code];
				last = index + 1;
				end = Math.min(index + 16, value.length);
			}
			if (index === value.length) break;
			ESCAPABLE.lastIndex = index;
		} else {
			if (last !== index) output += value.slice(last, index);
			output += HTML_ENTITIES[value.charCodeAt(index)];
			last = index + 1;
		}
	} while (ESCAPABLE.test(value));
	return last === value.length ? output : output + value.slice(last);
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
	return encodeMatches(value, pattern);
}

// The caller has already found the first one-unit match with pattern.test().
function encodeMatches(value: string, pattern: RegExp): string {
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
