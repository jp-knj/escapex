// src/escape.ts
const ESCAPABLE = /[&<>'"]/g;
const TEXT = /[&<>]/g;
const ATTRIBUTE = /[&<>'"\r\n]/g;
const HTML_ENTITIES = [
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&quot;",
	"",
	"",
	"",
	"&amp;",
	"&#39;",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&lt;",
	"",
	"&gt;"
];
const TEXT_ENTITIES = [
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&amp;",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&lt;",
	"",
	"&gt;"
];
const ATTRIBUTE_ENTITIES = [
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&#10;",
	"",
	"",
	"&#13;",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&quot;",
	"",
	"",
	"",
	"&amp;",
	"&#39;",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"&lt;",
	"",
	"&gt;"
];
/** Escapes &, <, >, ', and " in a primitive string for HTML text or quoted attributes. */
function escapeHTML(value) {
	if (typeof value !== "string") throw new TypeError("escape expects a primitive string");
	ESCAPABLE.lastIndex = 0;
	if (!ESCAPABLE.test(value)) return value;
	if (value.length >= 128) return escapeMatchedHTML(value, ESCAPABLE.lastIndex - 1);
	const first = ESCAPABLE.lastIndex - 1;
	let output = value.slice(0, first) + HTML_ENTITIES[value.charCodeAt(first)];
	let last = first + 1;
	if (value.length <= 16) for (let index = last; index < value.length; index++) {
		const code = value.charCodeAt(index);
		if (code > 62 || HTML_ENTITIES[code] === "") continue;
		if (last !== index) output += value.slice(last, index);
		output += HTML_ENTITIES[code];
		last = index + 1;
	}
	else for (let index = last; index < value.length; index++) {
		const code = value.charCodeAt(index);
		if (code > 62 || HTML_ENTITIES[code] === "") {
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
	return last === value.length ? output : output + value.slice(last);
}
function escapeMatchedHTML(value, firstMatch) {
	ESCAPABLE.lastIndex = firstMatch + 1;
	let output = "";
	let last = 0;
	do {
		let index = ESCAPABLE.lastIndex - 1;
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
function escapeText(value) {
	if (typeof value !== "string") throw new TypeError("escapeText expects a primitive string");
	return encode(value, TEXT, TEXT_ENTITIES, 0);
}
/**
* Escapes the five HTML characters and CR/LF for single- or double-quoted
* plain attribute values. Does not validate URLs, CSS or event handlers.
*/
function escapeAttribute(value) {
	if (typeof value !== "string") throw new TypeError("escapeAttribute expects a primitive string");
	return encode(value, ATTRIBUTE, ATTRIBUTE_ENTITIES, 3);
}
function encode(value, pattern, entities, maxGap) {
	pattern.lastIndex = 0;
	if (!pattern.test(value)) return value;
	let output = "";
	let last = 0;
	do {
		let index = pattern.lastIndex - 1;
		const contiguous = last > 0 && index - last <= maxGap;
		if (last !== index) output += value.slice(last, index);
		do
			output += entities[value.charCodeAt(index++)];
		while (contiguous && index < value.length && entities[value.charCodeAt(index)]);
		pattern.lastIndex = last = index;
	} while (pattern.test(value));
	return output + value.slice(last);
}
// src/unescape.ts
const ENTITIES = {
	"&amp;": "&",
	"&#38;": "&",
	"&lt;": "<",
	"&#60;": "<",
	"&gt;": ">",
	"&#62;": ">",
	"&apos;": "'",
	"&#39;": "'",
	"&quot;": "\"",
	"&#34;": "\""
};
const ENCODED = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;
/** Decodes the ten supported HTML references once; other references are preserved. */
function unescapeHTML(value) {
	if (typeof value !== "string") throw new TypeError("unescape expects a primitive string");
	return value.replace(ENCODED, (entity) => ENTITIES[entity]);
}
export { escapeText as a, escapeHTML as i, HTML_ENTITIES as n, escapeAttribute as r, unescapeHTML as t };
