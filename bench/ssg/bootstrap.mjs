import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainThread, threadId } from 'node:worker_threads';
import { PerformanceObserver, performance } from 'node:perf_hooks';

const started = performance.now();
const diagnostic = process.env.SSG_PROFILE === '1';
let gcCount = 0;
let gcMs = 0;
const destination = join(process.env.SSG_RUN_DIR, `process-${process.pid}-${threadId}.json`);
function flush() {
	const usage = process.resourceUsage();
	writeFileSync(destination, JSON.stringify({ pid: process.pid, threadId, isMainThread,
		elapsedMs: performance.now() - started, maxRssKiB: usage.maxRSS,
		userCpuMs: usage.userCPUTime / 1000, systemCpuMs: usage.systemCPUTime / 1000,
		gcCount: diagnostic ? gcCount : undefined, gcMs: diagnostic ? gcMs : undefined }));
}
if (diagnostic) {
	const observer = new PerformanceObserver(list => {
		for (const entry of list.getEntries()) { gcCount++; gcMs += entry.duration; }
		flush();
	});
	observer.observe({ entryTypes: ['gc'] });
}
process.on('exit', flush);
