import assert from 'node:assert/strict';

export function capacity(source) {
	assert.equal(source.split('Vec::with_capacity(input.len())').length, 3);
	return source.replaceAll('Vec::with_capacity(input.len())', 'Vec::with_capacity(input.len().saturating_mul(2))');
}

export function reuse(source) {
	assert.equal(source.split('Vec::with_capacity(input.len())').length, 3);
	source = source.replace('unsafe fn(&[u16], Mode) -> Vec<u16>', 'unsafe fn(&[u16], Mode, &mut Vec<u16>)');
	for (const name of ['escape', 'scalar', 'neon', 'sse2', 'avx2']) {
		const before = `fn ${name}(input: &[u16], mode: Mode) -> Vec<u16>`;
		assert(source.includes(before));
		source = source.replace(before, `fn ${name}(input: &[u16], mode: Mode, output: &mut Vec<u16>)`);
	}
	source = source.replace('implementation(input, mode)', 'implementation(input, mode, output)');
	source = source.replaceAll('let mut output = Vec::with_capacity(input.len());', 'output.clear();\n    output.reserve(input.len());');
	source = source.replace('    mask: impl Fn(*const u16, Mode) -> u64,\n) -> Vec<u16> {', '    mask: impl Fn(*const u16, Mode) -> u64,\n    output: &mut Vec<u16>,\n) {');
	source = source.replaceAll('&mut output', 'output');
	source = source.replaceAll('    output\n}', '}');
	for (const [lanes, stride, kind] of [[8, 8, 'neon'], [8, 2, 'sse2'], [16, 2, 'avx2']]) {
		const before = `scan::<${lanes}, ${stride}>(input, mode, |pointer, mode| unsafe {\n        ${kind}_mask(pointer, mode)\n    })`;
		assert(source.includes(before));
		source = source.replace(before, `scan::<${lanes}, ${stride}>(input, mode, |pointer, mode| unsafe {\n        ${kind}_mask(pointer, mode)\n    }, output)`);
	}
	const before = `        for &(name, implementation) in variants {\n            // SAFETY: implementations includes only CPU-supported functions.\n            assert_eq!(\n                unsafe { implementation(input, mode) },`;
	assert(source.includes(before));
	return source.replace(before, `        let mut actual = vec![0xffff; 67];\n        for &(name, implementation) in variants {\n            // SAFETY: implementations includes only CPU-supported functions.\n            unsafe { implementation(input, mode, &mut actual) };\n            assert_eq!(\n                actual,`);
}
