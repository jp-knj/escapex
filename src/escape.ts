// Originally derived from withastro/astro commit 2637ed10afd26f1f29db673616c6225eb0d848a6.
// Copyright (c) 2021 Fred K. Schott. MIT license; see LICENSE.

const ESCAPABLE = /[&<>'"]/g;
const TEXT = /[&<>]/g;
const ATTRIBUTE = /[&<>'"\r\n]/g;
// A literal lets bundlers remove this table when escapeHTML/native is unused.
// Empty entries classify non-target ASCII; matches reuse the same entity table.
// Shared with native.ts; not re-exported by the public index.ts entry.
export const HTML_ENTITIES: string[] = [
	// 0x00 - 0x0f
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	// 0x10 - 0x1f
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	// 0x20 - 0x2f
	'', '', '&quot;', '', '', '', '&amp;', '&#39;', '', '', '', '', '', '', '', '',
	// 0x30 - 0x3e
	'', '', '', '', '', '', '', '', '', '', '', '', '&lt;', '', '&gt;',
];

// Packed literals let single-export bundles retain only their context's table.
// Empty entries terminate a run; all other UTF-16 units remain unchanged.
const TEXT_ENTITIES: string[] = [
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '&amp;', '', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '', '', '', '&lt;', '', '&gt;',
];
const ATTRIBUTE_ENTITIES: string[] = [
	'', '', '', '', '', '', '', '', '', '', '&#10;', '', '', '&#13;', '', '',
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	'', '', '&quot;', '', '', '', '&amp;', '&#39;', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '', '', '', '&lt;', '', '&gt;',
];

/** Escapes &, <, >, ', and " in a primitive string for HTML text or quoted attributes. */
export function escapeHTML(value: string): string {
	if (typeof value !== 'string') throw new TypeError('escape expects a primitive string');
	ESCAPABLE.lastIndex = 0;
	if (!ESCAPABLE.test(value)) return value;
	if (value.length >= 128) return escapeMatchedHTML(value, ESCAPABLE.lastIndex - 1);
	const first = ESCAPABLE.lastIndex - 1;
	let output = value.slice(0, first) + HTML_ENTITIES[value.charCodeAt(first)];
	let last = first + 1;
	if (value.length <= 16) {
		for (let index = last; index < value.length; index++) {
			const code = value.charCodeAt(index);
			if (code > 62 || HTML_ENTITIES[code] === '') continue;
			if (last !== index) output += value.slice(last, index);
			output += HTML_ENTITIES[code];
			last = index + 1;
		}
	} else {
		for (let index = last; index < value.length; index++) {
			const code = value.charCodeAt(index);
			if (code > 62 || HTML_ENTITIES[code] === '') {
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

// Keep the long scan separate from the short-input path; firstMatch is already known.
function escapeMatchedHTML(value: string, firstMatch: number): string {
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
	if (typeof value !== 'string') throw new TypeError('escapeText expects a primitive string');
	return encode(value, TEXT, TEXT_ENTITIES, 0);
}

/**
 * Escapes the five HTML characters and CR/LF for single- or double-quoted
 * plain attribute values. Does not validate URLs, CSS or event handlers.
 */
export function escapeAttribute(value: string): string {
	if (typeof value !== 'string') throw new TypeError('escapeAttribute expects a primitive string');
	return encode(value, ATTRIBUTE, ATTRIBUTE_ENTITIES, 3);
}

function encode(value: string, pattern: RegExp, entities: readonly string[], maxGap: number): string {
	pattern.lastIndex = 0;
	if (!pattern.test(value)) return value;
	let output = '';
	let last = 0;
	do {
		let index = pattern.lastIndex - 1;
		// Keep isolated matches in regexp search. A nearby pair justifies
		// scanning a run; text uses an adjacent pair, attributes allow a gap.
		const contiguous = last > 0 && index - last <= maxGap;
		if (last !== index) output += value.slice(last, index);
		do {
			output += entities[value.charCodeAt(index++)];
		} while (contiguous && index < value.length && entities[value.charCodeAt(index)]);
		// Resume the regexp at the first unit outside the run, including any
		// quote or CR/LF that the current context deliberately preserves.
		pattern.lastIndex = last = index;
	} while (pattern.test(value));
	return output + value.slice(last);
}

export { escapeHTML as escape };
