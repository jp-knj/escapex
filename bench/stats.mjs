export function median(values) {
	const sorted = [...values].sort((a, b) => a - b);
	if (!sorted.length) throw new Error('Cannot summarize an empty sample');
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function pairedChanges(runs, variant, baseline = 'esm') {
	// Preserve the pairing: host load and JIT state differ between processes.
	return runs.map(({ medians }) => (medians[variant] / medians[baseline] - 1) * 100);
}
