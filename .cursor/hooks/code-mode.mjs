#!/usr/bin/env node
/** Cursor beforeShellExecution: 照会 bash の生連鎖を code-mode CLI へ誘導する。 */
import { readFileSync } from 'node:fs';
import { decideCodeModeGuard } from '../../scripts/lib/code-mode.mjs';

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
const decision = decideCodeModeGuard(cmd);
if (decision.action === 'deny') deny(decision.errors.join('\n'));
allow();
