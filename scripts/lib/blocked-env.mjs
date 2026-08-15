const ALLOW = new Set(['.env.example', '.env.sample']);

export function isBlockedEnvPath(p) {
	const base = String(p ?? '')
		.replace(/\\/g, '/')
		.split('/')
		.pop();
	if (!base || ALLOW.has(base)) return false;
	return base === '.env' || base === '.envrc' || base.startsWith('.env.');
}
