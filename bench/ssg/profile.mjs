export const lengthLimits = [16, 64, 256, 4096, 65536, Infinity];
export const lengthLabels = ['0-16', '17-64', '65-256', '257-4096', '4097-65536', '65537+'];
export function createProfile() {
	return { calls: 0, units: 0, unchanged: 0, targets: 0, maxLength: 0,
		lengths: lengthLabels.map(label => ({ label, calls: 0, units: 0, unchanged: 0, targets: 0 })) };
}
export function recordInput(profile, input) {
	let targets = 0;
	for (let i = 0; i < input.length; i++) {
		const c = input.charCodeAt(i);
		if (c === 34 || c === 38 || c === 39 || c === 60 || c === 62) targets++;
	}
	const bucket = profile.lengths[lengthLimits.findIndex(limit => input.length <= limit)];
	for (const item of [profile, bucket]) {
		item.calls++;
		item.units += input.length;
		item.unchanged += Number(targets === 0);
		item.targets += targets;
	}
	profile.maxLength = Math.max(profile.maxLength, input.length);
}
export function mergeProfiles(profiles) {
	const result = createProfile();
	for (const profile of profiles) {
		for (const key of ['calls', 'units', 'unchanged', 'targets']) {
			result[key] += profile[key];
			result.lengths.forEach((bucket, i) => { bucket[key] += profile.lengths[i][key]; });
		}
		result.maxLength = Math.max(result.maxLength, profile.maxLength);
	}
	return result;
}
