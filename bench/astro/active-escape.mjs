let active;

export function selectEscape(escape) { active = escape; }

// Every variant pays for the same forwarding call, including the ESM baseline.
export function escapeHTML(value) { return active(value); }
