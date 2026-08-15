#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';

const range = process.argv[2] || 'HEAD';
let log = '';
try {
	log = execSync(`git log ${range} --format=%s`, { encoding: 'utf8' });
} catch {
	process.exit(0);
}

const JP = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;
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
