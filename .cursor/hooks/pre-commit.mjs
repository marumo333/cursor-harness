#!/usr/bin/env node
/** Cursor beforeShellExecution: git commit を必ず hook に通す。 */
import { readFileSync } from 'node:fs';
import { decideCommitGuard } from '../../scripts/lib/commit-guard.mjs';
import { runPreCommit } from '../../scripts/lib/run-pre-commit.mjs';

let raw = '';
try {
	raw = readFileSync(0, 'utf8');
} catch {}
let data = {};
try {
	data = JSON.parse(raw || '{}');
} catch {}

function deny(message) {
	process.stdout.write(JSON.stringify({ permission: 'deny', user_message: message, agent_message: message }));
	process.exit(0);
}

function allow() {
	process.stdout.write(JSON.stringify({ permission: 'allow' }));
	process.exit(0);
}

const cmd = String(data.tool_input?.command ?? data.command ?? '');
const decision = decideCommitGuard(cmd);
if (decision.action === 'allow') allow();
if (decision.action === 'deny') deny(decision.errors.join('\n'));

const r = runPreCommit();
if (!r.ok) deny(r.message);
allow();
