import { median } from '../stats.mjs';
export function summarize(result) {
	const groups = [];
	for (const scenario of result.protocol.scenarios) for (const workerCount of result.protocol.workers) {
		const variants = result.protocol.variants.map(variant => {
			const runs = result.runs.filter(r => r.scenario === scenario && r.workerCount === workerCount && r.variant === variant);
			const times = runs.map(r => r.wallMs);
			return { variant, medianMs: median(times), minMs: Math.min(...times), maxMs: Math.max(...times),
				medianRssMiB: median(runs.map(r => r.maxRssMiB)), maxRssMiB: Math.max(...runs.map(r => r.maxRssMiB)),
				medianLoadMs: median(runs.flatMap(r => r.adapters.map(a => a.loadMs))) };
		});
		groups.push({ scenario, workerCount, variants });
	}
	return groups;
}
export function markdown(result) {
	const e = result.environment;
	const lines = ['# Full Astro static-build comparison', '',
		`${e.platform} ${e.arch}; ${e.cpu}; Node ${e.node}; Astro ${e.astro}.`, '',
		`Started: ${result.startedAt}. Completed: ${result.completedAt}. Source commit: ${result.sourceCommit}.`, '',
		`${result.protocol.rounds} independent fresh processes per implementation and scenario. Rotating order. Clean Astro caches; Node compile cache disabled; OS filesystem cache uncontrolled. Dependency installation and output verification excluded from wall time.`, '',
		'Wall time includes Node startup, Astro compilation, module initialization, rendering, all static file writes, and process exit. Peak RSS is the maximum for the Node process, including its Worker threads; it excludes separately spawned processes. Load time covers the selected API import plus Wasm file read and initialization, once per rendering thread. It is already included in wall time.', '',
		'All implementations and Worker counts must produce byte-identical static files. Profiling builds are separate and excluded from timings. GC event durations are diagnostic only: profile instrumentation changes allocation and Worker shutdown can omit final events. Do not subtract them from build time.', '',
		result.smoke ? '**SMOKE TEST ONLY: three pages per scenario; no performance conclusion.**' : 'Reproducible synthetic fixtures, not a production-site measurement.', '',
		'| Scenario | Workers | Implementation | Median seconds | Range seconds | Median peak MiB | Max peak MiB | Median import ms |',
		'|---|---:|---|---:|---:|---:|---:|---:|'];
	for (const group of result.summary) for (const v of group.variants) lines.push(`| ${group.scenario} | ${group.workerCount} | ${v.variant} | ${(v.medianMs / 1000).toFixed(3)} | ${(v.minMs / 1000).toFixed(3)}–${(v.maxMs / 1000).toFixed(3)} | ${v.medianRssMiB.toFixed(1)} | ${v.maxRssMiB.toFixed(1)} | ${v.medianLoadMs.toFixed(3)} |`);
	lines.push('', '## Actual escape inputs', '', '| Scenario | Pages | Calls | Unchanged % | UTF-16 units | Target units % | Maximum length | Output MiB |', '|---|---:|---:|---:|---:|---:|---:|---:|');
	for (const p of result.profiles.filter(p => p.workerCount === result.protocol.workers[0])) {
		const v = p.input;
		lines.push(`| ${p.scenario} | ${p.pages} | ${v.calls} | ${(100 * v.unchanged / v.calls).toFixed(2)} | ${v.units} | ${(100 * v.targets / v.units).toFixed(2)} | ${v.maxLength} | ${(p.output.bytes / 1048576).toFixed(2)} |`);
	}
	lines.push('', '| Scenario | Input length (UTF-16 units) | Calls | Unchanged calls | Total units | Targets |', '|---|---|---:|---:|---:|---:|');
	for (const p of result.profiles.filter(p => p.workerCount === result.protocol.workers[0])) for (const b of p.input.lengths) lines.push(`| ${p.scenario} | ${b.label} | ${b.calls} | ${b.unchanged} | ${b.units} | ${b.targets} |`);
	lines.push('', 'Raw samples, source hashes, output hashes, per-thread import measurements, and diagnostic profiles: [results.json](./results.json).', '');
	return lines.join('\n');
}
