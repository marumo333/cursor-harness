#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';
import { commitLogArgs } from './lib/commit-log-args.mjs';

const JP = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;

let log = '';
try {
	log = execFileSync('git', commitLogArgs(process.argv.slice(2)), {
		encoding: 'utf8',
	});
} catch (err) {
	const detail = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr) : String(err);
	console.error('[commit-range] git log に失敗した。');
	if (detail.trim()) console.error(detail.trim());
	process.exit(1);
}

let bad = 0;
for (const subject of log.split('\n').map((s) => s.trim()).filter(Boolean)) {
	const r = lintCommitMessage(subject);
	if (r.ok) continue;
	if (JP.test(subject) && !/^[a-z]+(\([^)]+\))?:/.test(subject)) continue;
	console.error('[commit-range] ' + subject);
	for (const e of r.errors) console.error('  ' + e);
	bad += 1;
}
process.exit(bad ? 1 : 0);
