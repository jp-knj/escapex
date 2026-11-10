import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { platform, arch, report } from 'node:process';
import { fileURLToPath } from 'node:url';
import { nativePlatform } from './native-platform.ts';
import { escapeHTML as escapeShortHTML, escapeText as escapeShortText,
	escapeAttribute as escapeShortAttribute, unescapeHTML as unescapeShortHTML } from './index.ts';

interface NativeBinding {
	escapeHtml(value: string): string;
	escapeText(value: string): string;
	escapeAttribute(value: string): string;
	unescapeHtml(value: string): string;
}

function linuxLibc(): 'gnu' | 'musl' {
	let diagnostic: { header?: { glibcVersionRuntime?: string }; sharedObjects?: string[] } | undefined;
	try { diagnostic = report.getReport() as typeof diagnostic; } catch { /* Fall back to ldd. */ }
	if (diagnostic?.header?.glibcVersionRuntime) return 'gnu';
	// process.report can be disabled by an embedder; the system ldd script is a fallback.
	try { if (readFileSync('/usr/bin/ldd', 'utf8').includes('musl')) return 'musl'; } catch { /* Try the report below. */ }
	const objects = diagnostic?.sharedObjects;
	if (objects?.some((path) => /(?:ld-musl-|libc\.musl-)/.test(path))) return 'musl';
	throw new Error('Cannot identify Linux libc for @jp-knj/html-escape/native (expected glibc or musl)');
}

function load(): NativeBinding {
	const id = nativePlatform(platform, arch, platform === 'linux' ? linuxLibc() : undefined);
	const require = createRequire(import.meta.url);
	const local = new URL(`./native/escape_html.${id}.node`, import.meta.url);
	const packageName = `@jp-knj/html-escape-${id}`;
	try {
		return existsSync(local) ? require(fileURLToPath(local)) : require(packageName);
	} catch (cause) {
		throw new Error(`Cannot load @jp-knj/html-escape/native for ${id}. Install ${packageName} at the same version with optional dependencies enabled, or run npm run build:native in the source checkout.`, { cause });
	}
}

// Fail on explicit import when the binary is unavailable, even for a no-op input.
const binding = load();
// For small inputs Node-API's two UTF-16 copies cost more than escaping in JS.
const NATIVE_MIN_LENGTH = 256;
const HTML = /[&<>'"]/;
const HTML_SCAN = /[&<>'"]/g;
const HTML_NATIVE_MIN_LENGTH = 128;
const HTML_ENTITIES: string[] = Array(63).fill('');
HTML_ENTITIES[34] = '&quot;';
HTML_ENTITIES[38] = '&amp;';
HTML_ENTITIES[39] = '&#39;';
HTML_ENTITIES[60] = '&lt;';
HTML_ENTITIES[62] = '&gt;';
const TEXT = /[&<>]/;
const ATTRIBUTE = /[&<>'"\r\n]/;
const ENCODED = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/;

function check(value: string, operation: string): void {
	if (typeof value !== 'string') throw new TypeError(`${operation} expects a primitive string`);
}

/** Escapes five HTML characters, preserving every other UTF-16 code unit. Node.js only. */
export function escapeHTML(value: string): string {
	// Delegate invalid inputs as well, preserving the shared primitive-string error.
	if (typeof value !== 'string' || value.length < HTML_NATIVE_MIN_LENGTH) return escapeShortHTML(value);
	const match = HTML.exec(value);
	if (!match) return value;
	let index = match.index;
	let last = index + 1;
	let nearby = 1;
	let output = value.slice(0, index) + HTML_ENTITIES[value.charCodeAt(index)];
	HTML_SCAN.lastIndex = last;
	while (HTML_SCAN.test(value)) {
		index = HTML_SCAN.lastIndex - 1;
		nearby = index - last < 16 ? nearby + 1 : 1;
		// Amortize Node-API copies only after a run of nearby matches. Sparse
		// strings finish in JS; the already-found positions are not searched again.
		if (nearby >= 8) return binding.escapeHtml(value);
		if (last !== index) output += value.slice(last, index);
		output += HTML_ENTITIES[value.charCodeAt(index)];
		last = index + 1;
	}
	return last === value.length ? output : output + value.slice(last);
}

/** Escapes &, < and > for HTML text nodes. Not for script/style contents. */
export function escapeText(value: string): string {
	check(value, 'escapeText');
	if (value.length < NATIVE_MIN_LENGTH) return escapeShortText(value);
	return TEXT.test(value) ? binding.escapeText(value) : value;
}

/** Escapes five HTML characters and CR/LF for quoted plain attributes. Does not validate URLs, CSS or event handlers. */
export function escapeAttribute(value: string): string {
	check(value, 'escapeAttribute');
	if (value.length < NATIVE_MIN_LENGTH) return escapeShortAttribute(value);
	return ATTRIBUTE.test(value) ? binding.escapeAttribute(value) : value;
}

/** Decodes the ten supported HTML references once; other references are preserved. */
export function unescapeHTML(value: string): string {
	check(value, 'unescape');
	if (value.length < NATIVE_MIN_LENGTH) return unescapeShortHTML(value);
	return ENCODED.test(value) ? binding.unescapeHtml(value) : value;
}

export { escapeHTML as escape, unescapeHTML as unescape };
