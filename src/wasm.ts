interface WasmExports {
	memory: WebAssembly.Memory;
	reserve_input(length: number): number;
	escape(length: number): number;
	escape_text(length: number): number;
	escape_attribute(length: number): number;
	unescape(length: number): number;
}

let wasm: WasmExports | undefined;
let pending: Promise<void> | undefined;
const ESCAPABLE = /[&<>'"]/;
const TEXT = /[&<>]/;
const ATTRIBUTE = /[&<>'"\r\n]/;
const ENCODED = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/;
const ERROR = 0xffff_ffff;
const CHUNK = 16_384;
// Use the native UTF-16 decoder only when it cannot replace an unpaired surrogate.
// ignoreBOM preserves a literal leading U+FEFF rather than treating it as metadata.
const isWellFormed = (String.prototype as string & { isWellFormed?: () => boolean }).isWellFormed;
let decoder: TextDecoder | undefined;

/** Initialize once from the separately distributed Wasm bytes. Failed attempts can be retried. */
export function init(bytes: Uint8Array): Promise<void> {
	if (pending) return pending;
	pending = (async () => {
		try {
			if (!(bytes instanceof Uint8Array)) throw new TypeError('init expects a Uint8Array');
			const { instance } = await WebAssembly.instantiate(bytes as Uint8Array<ArrayBuffer>);
			const exports = instance.exports;
			if (!(exports.memory instanceof WebAssembly.Memory)
				|| typeof exports.reserve_input !== 'function' || typeof exports.escape !== 'function'
				|| typeof exports.escape_text !== 'function' || typeof exports.escape_attribute !== 'function'
				|| typeof exports.unescape !== 'function') {
				throw new TypeError('Invalid escape-html Wasm module');
			}
			wasm = exports as unknown as WasmExports;
		} catch (error) {
			// Defer clearing until pending has been assigned, including synchronous failures.
			await Promise.resolve();
			pending = undefined;
			throw error;
		}
	})();
	return pending;
}

/** Escapes five HTML characters, preserving every other UTF-16 code unit. Call init first. */
export function escapeHTML(value: string): string {
	return transform(value, 'escape', ESCAPABLE);
}

/** Escapes &, < and > for HTML text nodes, excluding script/style. Call init first. */
export function escapeText(value: string): string {
	return transform(value, 'escape_text', TEXT);
}

/**
 * Escapes five HTML characters and CR/LF for quoted plain attributes. Call init first.
 * Does not validate URLs, CSS or event handlers.
 */
export function escapeAttribute(value: string): string {
	return transform(value, 'escape_attribute', ATTRIBUTE);
}

/** Decodes one layer of supported HTML references. Call init first. */
export function unescapeHTML(value: string): string {
	return transform(value, 'unescape', ENCODED);
}

export { escapeHTML as escape, unescapeHTML as unescape };

function transform(value: string, operation: 'escape' | 'escape_text' | 'escape_attribute' | 'unescape', pattern: RegExp): string {
	if (typeof value !== 'string') throw new TypeError(`${operation} expects a primitive string`);
	if (!wasm) throw new Error(`Call and await init(bytes) before ${operation}`);
	if (!pattern.test(value)) return value;
	const length = value.length;
	const pointer = wasm.reserve_input(length) >>> 0;
	if (pointer === ERROR) throw new RangeError('Wasm input exceeds available memory');
	const input = new Uint16Array(wasm.memory.buffer, pointer, length);
	for (let index = 0; index < length; index++) input[index] = value.charCodeAt(index);
	const outputLength = wasm[operation](length) >>> 0;
	if (outputLength === ERROR) throw new RangeError('Wasm output exceeds available memory');
	// escape() can grow memory and detach input.buffer. Always get the new buffer.
	const output = new Uint16Array(wasm.memory.buffer, pointer + length * 2, outputLength);
	if (isWellFormed?.call(value)) {
		decoder ??= new TextDecoder('utf-16le', { ignoreBOM: true });
		return decoder.decode(output);
	}
	const chunks: string[] = [];
	for (let index = 0; index < outputLength; index += CHUNK) {
		chunks.push(String.fromCharCode.apply(null, output.subarray(index, index + CHUNK) as unknown as number[]));
	}
	return chunks.join('');
}
