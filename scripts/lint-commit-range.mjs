#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';
import { parseCommitLogRequest, parseCommitLogRecords, shouldSkipLegacyJa } from './lib/commit-log-args.mjs';

const parsed = parseCommitLogRequest(process.argv.slice(2));
if (!parsed.ok) {
	console.error('[commit-range] ' + parsed.reason);
	process.exit(1);
}

let log = '';
try {
	log = execFileSync('git', parsed.args, { encoding: 'utf8' });
} catch (err) {
	const detail = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr) : String(err);
	console.error('[commit-range] git log に失敗した。');
	if (detail.trim()) console.error(detail.trim());
	process.exit(1);
}

const records = parseCommitLogRecords(log);
if (parsed.mode === 'tip' && records.length === 0) {
	console.error('[commit-range] 先端主語が空です。');
	process.exit(1);
}

let bad = 0;
for (const rec of records) {
	if (!rec.subject) {
		console.error('[commit-range] 主語が空です。');
		bad += 1;
		continue;
	}
	const r = lintCommitMessage(rec.subject, {
		parentCount: rec.parentCount,
		allowFixup: false,
		skipHashComments: false
	});
	if (r.ok) continue;
	if (shouldSkipLegacyJa(rec.subject, parsed.mode)) continue;
	console.error('[commit-range] ' + rec.subject);
	for (const e of r.errors) console.error('  ' + e);
	bad += 1;
}
process.exit(bad ? 1 : 0);
