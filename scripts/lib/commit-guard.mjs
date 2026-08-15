import { lintCommitMessage } from './commit-msg-lint.mjs';
import { parseGitCommitCommand } from './git-commit-cmd.mjs';

export function splitShellSegments(command) {
	return String(command ?? '')
		.split(/\s*(?:&&|\|\||;)\s*/)
		.filter(Boolean);
}

export function bypassesHookInfra(command) {
	const cmd = String(command ?? '');
	if (/GIT_CONFIG_/i.test(cmd) && /hooksPath/i.test(cmd)) return true;
	if (/\bgit\s+config\b/.test(cmd) && /hooksPath/i.test(cmd)) return true;
	if (/\bchmod\b/.test(cmd) && /githooks/.test(cmd)) return true;
	return false;
}

export function decideCommitGuard(command) {
	const cmd = String(command ?? '');
	if (bypassesHookInfra(cmd)) {
		return { action: 'deny', errors: ['[commit-guard] hook 基盤の無効化は禁止。'] };
	}
	let needPrecommit = false;
	for (const seg of splitShellSegments(cmd)) {
		const parsed = parseGitCommitCommand(seg);
		if (!parsed.isCommit) continue;
		if (parsed.skipsHooks) {
			return {
				action: 'deny',
				errors: ['[commit-guard] --no-verify / -n / core.hooksPath 無効化は禁止。hook を必ず通す。']
			};
		}
		if (parsed.foreignRepo) {
			return { action: 'deny', errors: ['[commit-guard] 別リポへの git commit は禁止。'] };
		}
		if (parsed.messages.length > 0) {
			const lint = lintCommitMessage(parsed.messages.join('\n\n'));
			if (!lint.ok) return { action: 'deny', errors: lint.errors };
		}
		needPrecommit = true;
	}
	return needPrecommit ? { action: 'run-pre-commit', errors: [] } : { action: 'allow', errors: [] };
}
