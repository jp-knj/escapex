const ENTITIES: Record<string, string> = {
	'&amp;': '&', '&#38;': '&',
	'&lt;': '<', '&#60;': '<',
	'&gt;': '>', '&#62;': '>',
	'&apos;': "'", '&#39;': "'",
	'&quot;': '"', '&#34;': '"',
};
const ENCODED = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;

/** Decodes the ten supported HTML references once; other references are preserved. */
export function unescapeHTML(value: string): string {
	if (typeof value !== 'string') throw new TypeError('unescape expects a primitive string');
	return value.replace(ENCODED, (entity) => ENTITIES[entity]);
}

export { unescapeHTML as unescape };
