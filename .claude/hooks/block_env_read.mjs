#!/usr/bin/env node
/**
 * .env 読み取りブロック（規約1）。
 * - Claude Code PreToolUse(Bash): tool_input.command を検査 → 拒否は exit 2
 * - Cursor beforeShellExecution / beforeReadFile: JSON で拒否
 */
import { readFileSync } from 'node:fs';

let raw = '';
try {
	raw = readFileSync(0, 'utf8');
} catch {}
let data = {};
try {
	data = JSON.parse(raw || '{}');
} catch {}

const cmd = String(data.tool_input?.command ?? data.command ?? '');
const filePath = String(
	data.tool_input?.file_path ?? data.tool_input?.path ?? data.filePath ?? data.path ?? ''
).replace(/\\/g, '/');

/** cat/less/head 等での .env 読み、source .env、printenv（シークレット晒し） */
const SHELL_ENV_READ =
	/(?:^|[;&|\n]\s*|&&\s*|\|\|\s*)(?:sudo\s+)?(?:cat|less|more|head|tail|bat|nl|od|hexdump|xxd)\b[^;&|\n]*\.env\b|(?:^|[;&|\n]\s*)(?:source|\.)\s+[^\s]*\.env\b|(?:^|[;&|\n]\s*)printenv\b/;

const isEnvFile = /(^|\/)\.env(\.[^/]+)?$/.test(filePath) && !/\.env\.example$/.test(filePath);
const isShellHit = cmd.length > 0 && SHELL_ENV_READ.test(cmd);

const isCursor =
	data.permission !== undefined ||
	data.command !== undefined ||
	data.filePath !== undefined ||
	data.hook_event_name !== undefined ||
	typeof data.cwd === 'string';

function denyCursor(message) {
	process.stdout.write(
		JSON.stringify({
			permission: 'deny',
			user_message: message,
			agent_message: message
		})
	);
	process.exit(0);
}

function allowCursor() {
	process.stdout.write(JSON.stringify({ permission: 'allow' }));
	process.exit(0);
}

if (isEnvFile || isShellHit) {
	const msg =
		'[block_env_read] 規約1: .env / シークレット環境変数の読み取りは禁止（人間がパイプ渡し）。';
	if (isCursor) denyCursor(msg);
	console.error(msg);
	process.exit(2);
}

if (isCursor) allowCursor();
process.exit(0);
