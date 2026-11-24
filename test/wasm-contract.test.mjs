import assert from 'node:assert/strict';
import { test } from 'node:test';

let instance = 0;
const fresh = () => import(new URL(`../dist/wasm.mjs?contract=${instance++}`, import.meta.url));
const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
const operations = [
	['escape', 'escape', '&', '&amp;'], ['escapeHTML', 'escape', '&', '&amp;'],
	['escapeText', 'escape_text', '&', '&amp;'], ['escapeAttribute', 'escape_attribute', '&', '&amp;'],
	['unescape', 'unescape', '&amp;', '&'], ['unescapeHTML', 'unescape', '&amp;', '&'],
];
const units = value => value.split('').map(char => char.charCodeAt(0));

// Stub only the instantiation/ABI boundary. Memory and typed-array behavior are
// real; expected input and output are supplied as literals, not another encoder.
function fixture(input = '&', output = '&amp;') {
	const memory = new WebAssembly.Memory({ initial: 1 });
	const pointer = 8;
	const state = { failure: undefined, code: -1, calls: [] };
	const ensure = end => {
		if (end > memory.buffer.byteLength) memory.grow(Math.ceil((end - memory.buffer.byteLength) / 65536));
	};
	const exports = {
		memory,
		reserve_input(length) {
			state.calls.push('reserve_input');
			assert.equal(length, input.length);
			if (state.failure === 'input') return state.code;
			ensure(pointer + length * 2);
			return pointer;
		},
	};
	for (const operation of ['escape', 'escape_text', 'escape_attribute', 'unescape']) {
		exports[operation] = length => {
			state.calls.push(operation);
			assert.equal(length, input.length);
			const actual = new Uint16Array(memory.buffer, pointer, length);
			const expected = units(input);
			// Stop at the first mismatch: formatting a diff of tens of thousands
			// of code units can hide an assertion failure behind a runner timeout.
			for (let index = 0; index < length; index++) assert.equal(actual[index], expected[index], `input code unit ${index}`);
			if (state.failure === 'output') return state.code;
			ensure(pointer + (length + output.length) * 2);
			new Uint16Array(memory.buffer, pointer + length * 2, output.length).set(units(output));
			return output.length;
		};
	}
	return { exports, state };
}

test('Wasm contract: every required export is validated independently, with retry after rejection', async t => {
	let candidate;
	t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: candidate } }));
	for (const name of ['memory', 'reserve_input', 'escape', 'escape_text', 'escape_attribute', 'unescape']) {
		for (const kind of ['missing', 'wrong type']) {
			const good = fixture();
			candidate = { ...good.exports };
			if (kind === 'missing') delete candidate[name];
			else candidate[name] = name === 'memory' ? { buffer: new ArrayBuffer(65536) } : 0;
			const api = await fresh();
			await assert.rejects(api.init(bytes), { name: 'TypeError', message: 'Invalid escape-html Wasm module' }, `${name}: ${kind}`);
			assert.throws(() => api.escape('&'), /Call and await init/);
			candidate = good.exports;
			await api.init(bytes);
			assert.equal(api.escape('&'), '&amp;', `recovery after ${name}: ${kind}`);
		}
	}
});

test('Wasm contract: synchronous input failures allow a valid initialization attempt', async t => {
	const good = fixture();
	const instantiate = t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: good.exports } }));
	for (const invalid of [null, undefined, {}, [], new ArrayBuffer(8), new Uint16Array(8), new DataView(new ArrayBuffer(8))]) {
		const api = await fresh();
		const before = instantiate.mock.callCount();
		await assert.rejects(api.init(invalid), { name: 'TypeError', message: 'init expects a Uint8Array' });
		assert.equal(instantiate.mock.callCount(), before);
		await api.init(bytes);
		assert.equal(api.escape('&'), '&amp;');
	}
});

test('Wasm contract: concurrent failed initialization shares its error and permits retry', async t => {
	let reject;
	let result = new Promise((_, fail) => { reject = fail; });
	const instantiate = t.mock.method(WebAssembly, 'instantiate', () => result);
	const api = await fresh();
	const first = api.init(bytes);
	assert.equal(api.init(bytes), first);
	assert.equal(instantiate.mock.callCount(), 1);
	const failure = new WebAssembly.CompileError('fixture compilation failed');
	const rejected = assert.rejects(first, error => error === failure);
	reject(failure);
	await rejected;
	result = Promise.resolve({ instance: { exports: fixture().exports } });
	const retry = api.init(bytes);
	assert.notEqual(retry, first);
	await retry;
	assert.equal(api.init(bytes), retry);
	assert.equal(instantiate.mock.callCount(), 2);
	assert.equal(api.escape('&'), '&amp;');
});

for (const stage of ['input', 'output']) {
	test(`Wasm contract: ${stage} memory errors preserve the error contract and allow reuse`, async t => {
		let current;
		t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: current.exports } }));
		for (const [name, operation, input, output] of operations) {
			for (const code of [-1, 0xffff_ffff]) {
				current = fixture(input, output);
				current.state.failure = stage;
				current.state.code = code;
				const api = await fresh();
				await api.init(bytes);
				assert.throws(() => api[name](input), {
					name: 'RangeError', message: `Wasm ${stage} exceeds available memory`,
				}, `${name}: ${code}`);
				assert.deepEqual(current.state.calls, stage === 'input' ? ['reserve_input'] : ['reserve_input', operation]);
				if (stage === 'input') assert(new Uint8Array(current.exports.memory.buffer).every(byte => byte === 0), 'failed reservation must not write input');
				current.state.failure = undefined;
				assert.equal(api[name](input), output, `${name}: recovery after ${stage} error`);
			}
		}
	});
}

test('Wasm contract: validation precedes initialization and no-match calls avoid the ABI', async t => {
	const current = fixture();
	t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: current.exports } }));
	const api = await fresh();
	let inspected = false;
	const invalid = { [Symbol.toPrimitive]() { inspected = true; throw new Error('coerced'); } };
	for (const [name, operation] of operations) {
		assert.throws(() => api[name](invalid), { name: 'TypeError', message: `${operation} expects a primitive string` });
		assert.throws(() => api[name](''), { name: 'Error', message: `Call and await init(bytes) before ${operation}` });
	}
	await api.init(bytes);
	for (const [name, operation] of operations) {
		assert.throws(() => api[name](invalid), { name: 'TypeError', message: `${operation} expects a primitive string` });
		assert.equal(api[name]('plain\0😀'), 'plain\0😀');
		assert.equal(api[name](''), '');
	}
	assert.equal(inspected, false);
	assert.deepEqual(current.state.calls, []);
});

test('Wasm contract: each context forwards every supported target and skips unrelated text', async t => {
	let current;
	t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: current.exports } }));
	const html = [['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ["'", '&#39;'], ['"', '&quot;']];
	const encoded = [['&amp;', '&'], ['&#38;', '&'], ['&lt;', '<'], ['&#60;', '<'], ['&gt;', '>'],
		['&#62;', '>'], ['&apos;', "'"], ['&#39;', "'"], ['&quot;', '"'], ['&#34;', '"']];
	for (const [name, operation] of operations) {
		const targets = operation === 'unescape' ? encoded : operation === 'escape_text' ? html.slice(0, 3)
			: operation === 'escape_attribute' ? [...html, ['\r', '&#13;'], ['\n', '&#10;']] : html;
		for (const [target, replacement] of targets) {
			for (const [prefix, suffix] of [['', ''], ['before', 'after']]) {
				const input = prefix + target + suffix;
				const output = prefix + replacement + suffix;
				current = fixture(input, output);
				const api = await fresh();
				await api.init(bytes);
				assert.equal(api[name](input), output, `${name}: ${JSON.stringify(input)}`);
				assert.deepEqual(current.state.calls, ['reserve_input', operation]);
			}
		}
		const unchanged = operation === 'unescape' ? ['&', '&AMP;', '&#x26;', '&amp', '&am;', '&#13;', '&bogus;']
			: operation === 'escape_text' ? ["'", '"', '\r', '\n', '[]{}()']
			: operation === 'escape_attribute' ? ['\t', '[]{}()'] : ['\r', '\n', '\t', '[]{}()'];
		current = fixture();
		const api = await fresh();
		await api.init(bytes);
		for (const value of unchanged) assert.equal(api[name](value), value);
		assert.deepEqual(current.state.calls, []);
	}
});

test('Wasm contract: real memory growth and UTF-16 decoding preserve BOM, surrogate pairs, and lone surrogates', async t => {
	let current;
	t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: current.exports } }));
	for (const [input, output, grows] of [
		['\ufeff&😀', '\ufeff&amp;😀', false],
		['\ufeff' + 'x'.repeat(40000) + '&😀', '\ufeff' + 'x'.repeat(40000) + '&amp;😀', true],
		['x'.repeat(16383) + '\ud800&\udfff😀', 'x'.repeat(16383) + '\ud800&amp;\udfff😀', true],
	]) {
		current = fixture(input, output);
		const api = await fresh();
		await api.init(bytes);
		const before = current.exports.memory.buffer;
		assert.equal(api.escapeHTML(input), output);
		if (grows) assert.equal(before.byteLength, 0, 'the pre-growth buffer was detached');
		assert.deepEqual(current.state.calls, ['reserve_input', 'escape']);
	}
});

test('Wasm contract: runtimes without isWellFormed preserve UTF-16 through the chunked fallback', async t => {
	const input = '\ufeff' + 'x'.repeat(16383) + '😀&';
	const output = '\ufeff' + 'x'.repeat(16383) + '😀&amp;';
	const current = fixture(input, output);
	t.mock.method(WebAssembly, 'instantiate', async () => ({ instance: { exports: current.exports } }));
	const original = Object.getOwnPropertyDescriptor(String.prototype, 'isWellFormed');
	let api;
	try {
		Object.defineProperty(String.prototype, 'isWellFormed', { configurable: true, value: undefined });
		api = await fresh();
	} finally {
		if (original) Object.defineProperty(String.prototype, 'isWellFormed', original);
		else delete String.prototype.isWellFormed;
	}
	await api.init(bytes);
	assert.equal(api.escape(input), output);
});
