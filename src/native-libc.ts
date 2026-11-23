/** Internal: callbacks keep Linux detection testable on every host. */
export function detectLinuxLibc(getReport: () => unknown, readLdd: () => string): 'gnu' | 'musl' {
	let diagnostic: { header?: { glibcVersionRuntime?: string }; sharedObjects?: string[] } | undefined;
	try { diagnostic = getReport() as typeof diagnostic; } catch { /* Fall back to ldd. */ }
	if (diagnostic?.header?.glibcVersionRuntime) return 'gnu';
	// process.report can be disabled by an embedder; the system ldd script is a fallback.
	try { if (readLdd().includes('musl')) return 'musl'; } catch { /* Try the report below. */ }
	const objects = diagnostic?.sharedObjects;
	if (objects?.some((path) => /(?:ld-musl-|libc\.musl-)/.test(path))) return 'musl';
	throw new Error('Cannot identify Linux libc for escapex/native (expected glibc or musl)');
}
