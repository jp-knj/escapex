// Benchmark baseline from 7ba356c (before short-string JS search changes).
// Astro-derived escaping code; MIT, copyright Fred K. Schott. See LICENSE.
// src/escape-html.ts
const ESCAPABLE = /[&<>'"]/g;
const TEXT = /[&<>]/g;
const ATTRIBUTE = /[&<>'"\r\n]/g;
function entityFor(code) {
	switch (code) {
		case 10: return "&#10;";
		case 13: return "&#13;";
		case 38: return "&amp;";
		case 60: return "&lt;";
		case 62: return "&gt;";
		case 39: return "&#39;";
		default: return "&quot;";
	}
}
/** Escapes &, <, >, ', and " in a primitive string for HTML text or quoted attributes. */
function escapeHTML(value) {
	return encode(value, ESCAPABLE, "escape");
}
/** Escapes &, < and > for HTML text nodes. Not for script/style contents. */
function escapeText(value) {
	return encode(value, TEXT, "escapeText");
}
/**
* Escapes the five HTML characters and CR/LF for single- or double-quoted
* plain attribute values. Does not validate URLs, CSS or event handlers.
*/
function escapeAttribute(value) {
	return encode(value, ATTRIBUTE, "escapeAttribute");
}
function encode(value, pattern, operation) {
	if (typeof value !== "string") throw new TypeError(`${operation} expects a primitive string`);
	pattern.lastIndex = 0;
	if (!pattern.test(value)) return value;
	let output = "";
	let last = 0;
	do {
		const index = pattern.lastIndex - 1;
		if (last !== index) output += value.slice(last, index);
		output += entityFor(value.charCodeAt(index));
		last = index + 1;
	} while (pattern.test(value));
	return last === value.length ? output : output + value.slice(last);
}
// src/unescape-html.ts
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
export { escapeHTML, escapeHTML as escape, escapeText, escapeAttribute, unescapeHTML, unescapeHTML as unescape };
