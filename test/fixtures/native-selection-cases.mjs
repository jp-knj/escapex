// Lengths and positions are UTF-16 code units, including inside surrogate pairs.
const targets = '&<>\'"';
function atPositions(length, positions, fill = 'a') {
	const units = fill.repeat(Math.ceil(length / fill.length)).slice(0, length).split('');
	positions.forEach((position, i) => { units[position] = targets[i % targets.length]; });
	return units.join('');
}
const runPositions = (count, gap, start = 0) => Array.from({ length: count }, (_, i) => start + i * gap);
const spaced = (length, gap, fill = 'a') => atPositions(length, runPositions(Math.ceil(length / gap), gap), fill);
function sampledPositions(length, count = 4) {
	return [1, 2, 3].flatMap(quarter => runPositions(count, 32, Math.floor(length * quarter / 4)));
}

export const cases = {};
for (const length of [4095, 4096, 4097]) {
	for (const gap of [16, 24, 32, 33, 48]) cases[`spread-${length}-${gap}`] = spaced(length, gap);
}
for (const gap of [24, 32]) cases[`spread-8192-${gap}`] = spaced(8192, gap);
for (const count of [7, 8, 9]) {
	for (const location of ['head', 'middle', 'tail']) {
		const start = location === 'head' ? 0 : location === 'middle' ? 2048 : 4095 - (count - 1) * 16;
		cases[`cluster-${location}-${count}`] = atPositions(4096, runPositions(count, 16, start));
	}
}
for (const gap of [24, 32, 33]) cases[`head-only-${gap}`] = atPositions(8192, runPositions(8, gap));
cases['samples-only'] = atPositions(8192, sampledPositions(8192));
cases['head-and-samples-only'] = atPositions(8192, [...runPositions(8, 24), ...sampledPositions(8192)]);
cases['failed-sample-then-dense'] = atPositions(8192, [...runPositions(8, 24), ...runPositions(8, 16, 4096)]);
cases['irregular-spread'] = atPositions(8192, Array.from({ length: 320 }, (_, i) => Math.floor(i * 25.5)));
for (const [name, fill] of [['japanese', '日本語'], ['emoji', '😀'], ['surrogate', '\ud800x\udfff']]) {
	cases[`spread-${name}`] = spaced(8192, 24, fill);
	cases[`tail-${name}`] = atPositions(4096, runPositions(8, 16, 3983), fill);
}
