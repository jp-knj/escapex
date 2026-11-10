import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Both benchmark protocols render identical compiled fixtures and props.
export async function createRender(escapeUrl, scenario) {
	const escapeModule = import.meta.resolve('astro/runtime/server/escape.js');
	let intercepted = 0;
	// Substitute only Astro's escapeHTML export, preserving all other runtime exports.
	// This is benchmark instrumentation; installed Astro files are never modified.
	registerHooks({ load(url, context, nextLoad) {
		if (url !== escapeModule) return nextLoad(url, context);
		intercepted++;
		return { format: 'module', shortCircuit: true, source: `export * from ${JSON.stringify(`${url}?original`)}; export { escapeHTML } from ${JSON.stringify(escapeUrl.href)};` };
	} });
	const { experimental_AstroContainer } = await import('astro/container');
	const { default: Page } = await import(`./generated/${scenario}.mjs`);
	assert.equal(intercepted, 1, 'Astro escape module must be replaced exactly once');
	const data = Array.from({ length: 4096 }, (_, id) => ({ id, title: `日本語 😀 item "${id}"`, html: '<a href="/a?x=1&y=2">&</a>' }));
	const options = scenario === 'large-props' ? { props: { data } }
		: scenario === 'official-portfolio-hero' ? { props: { title: 'Design & development', tagline: '日本語 😀 <fast> "websites"', align: 'start' } }
		: {};
	const render = async () => {
		// renderToResponse appends a route to its container's manifest on every
		// call. Reusing it makes the workload grow with the number of iterations.
		// Include a fresh container in every timed render for every variant.
		const container = await experimental_AstroContainer.create({ streaming: true });
		const response = await container.renderToResponse(Page, options);
		assert.equal(response.status, 200);
		return response.text();
	};
	return render;
}
