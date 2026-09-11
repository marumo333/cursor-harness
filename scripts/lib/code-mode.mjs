import { spawnSync } from 'node:child_process';

const INSPECT_GIT =
	/\bgit\s+(status|diff|log|show|rev-parse|blame|ls-files|describe|shortlog)(?=\s|$)/;
const INSPECT_BRANCH = /\bgit\s+branch\b/;
const BRANCH_MUTATE = /\s(-d|-D|-m|-M)\b/;
const MUTATE =
	/\bgit\s+(commit|add|push|fetch|pull|rebase|merge|checkout|switch|restore|reset|stash|tag|cherry-pick|revert|clean|rm|mv|init|remote|config)\b/;

export function splitShellSegments(command) {
	return String(command ?? '')
		.split(/\s*(?:&&|\|\||;)\s*/)
		.filter(Boolean);
}

export function isCodeModeCommand(command) {
	return /\bnode\s+(?:\.\/)?(?:scripts\/)?code-mode\.mjs\b/.test(String(command ?? ''));
}

export function extractCodeModeSteps(command) {
	const src = String(command ?? '');
	const steps = [];
	const re = /--step\s+(?:'([^']*)'|"([^"]*)")/g;
	let m;
	while ((m = re.exec(src))) steps.push(m[1] ?? m[2] ?? '');
	return steps.filter(Boolean);
}

export function classifySegment(seg) {
	const s = String(seg ?? '').trim();
	if (!s) return 'other';
	if (isCodeModeCommand(s)) return 'code-mode';
	if (MUTATE.test(s)) return 'mutate';
	if (INSPECT_GIT.test(s)) return 'inspect';
	if (INSPECT_BRANCH.test(s) && !BRANCH_MUTATE.test(s)) return 'inspect';
	return 'other';
}

export function decideCodeModeGuard(command) {
	const cmd = String(command ?? '');
	if (isCodeModeCommand(cmd)) return { action: 'allow', errors: [] };
	const kinds = splitShellSegments(cmd).map(classifySegment);
	const inspects = kinds.filter((k) => k === 'inspect').length;
	const hasMutate = kinds.includes('mutate');
	const hasOther = kinds.includes('other');
	if (inspects >= 2 && !hasMutate && !hasOther) {
		return {
			action: 'deny',
			errors: [
				'[code-mode] 照会 bash が2本以上ある。node scripts/code-mode.mjs --step で1回にまとめよ。中間出力は文脈に載せない。'
			]
		};
	}
	return { action: 'allow', errors: [] };
}

function tail(text, max) {
	const s = String(text ?? '');
	if (s.length <= max) return s;
	return s.slice(s.length - max);
}

export function summarizeResults(rawSteps, maxBytes) {
	const steps = (rawSteps ?? []).map((s) => ({
		cmd: s.cmd,
		exit: s.exit,
		stdout_tail: tail(s.stdout, 2048),
		stderr_tail: tail(s.stderr, 512)
	}));
	const draft = {
		schema: 'code-mode/v1',
		ok: (rawSteps ?? []).every((s) => s.exit === 0),
		steps,
		bytes: 0
	};
	const encoded = JSON.stringify(draft);
	draft.bytes = Buffer.byteLength(encoded);
	const again = JSON.stringify(draft);
	if (Buffer.byteLength(again) > maxBytes) {
		return {
			schema: 'code-mode/v1',
			ok: false,
			error: '上限を超えた。truncate しない。',
			bytes: Buffer.byteLength(again)
		};
	}
	draft.bytes = Buffer.byteLength(again);
	return draft;
}

export function runCodeMode({ steps, cwd, maxBytes = 16384 }) {
	if (!Array.isArray(steps) || steps.length === 0) {
		throw new Error('空の step は実行しない');
	}
	const raw = [];
	for (const cmd of steps) {
		const r = spawnSync('bash', ['-lc', cmd], {
			cwd,
			encoding: 'utf8',
			maxBuffer: Math.max(maxBytes, 1024)
		});
		raw.push({
			cmd,
			exit: r.status ?? 1,
			stdout: r.stdout ?? '',
			stderr: r.stderr ?? ''
		});
		if ((r.status ?? 1) !== 0) break;
	}
	return summarizeResults(raw, maxBytes);
}
