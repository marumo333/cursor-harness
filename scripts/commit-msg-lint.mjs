#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { lintCommitMessage } from './lib/commit-msg-lint.mjs';

const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
const r = lintCommitMessage(src);
if (!r.ok) {
	for (const e of r.errors) console.error('[commit-msg] ' + e);
	process.exit(1);
}
process.exit(0);
