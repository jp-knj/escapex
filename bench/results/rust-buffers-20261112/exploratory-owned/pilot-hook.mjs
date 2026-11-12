import '../../bench/native-selection/select.mjs';
import { registerHooks } from 'node:module';
const worker = new URL('../../bench/competitors/worker.mjs', import.meta.url).href;
registerHooks({ load(url, context, nextLoad) {
	const value = nextLoad(url, context);
	if (url === worker) return { ...value, source: value.source.toString().replace('start < 300', 'start < 50').replace('warm < 100', 'warm < 20') };
	return value;
} });
