#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';

function gitPath(name) {
	try {
		return execFileSync('git', ['rev-parse', '--git-path', name], { encoding: 'utf8' }).trim();
	} catch {
		return '';
	}
}

function hookContext() {
	const mergeHead = gitPath('MERGE_HEAD');
	const rebaseMerge = gitPath('rebase-merge');
	const rebaseApply = gitPath('rebase-apply');
	return {
		isMerge: Boolean(mergeHead && existsSync(mergeHead)),
		allowFixup: Boolean((rebaseMerge && existsSync(rebaseMerge)) || (rebaseApply && existsSync(rebaseApply)))
	};
}

const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
const r = lintCommitMessage(src, hookContext());
if (!r.ok) {
	for (const e of r.errors) console.error('[commit-msg] ' + e);
	process.exit(1);
}
process.exit(0);
