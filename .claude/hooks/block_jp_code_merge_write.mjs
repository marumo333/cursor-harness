#!/usr/bin/env node
// PreToolUse(Write|Edit): 規約5 — jp-code-agent から jp-code-merge への書き込みを機械的に禁止。
// 接続は endpoint 契約①下り + データ②上り のみ（../jp-code-merge/BOUNDARY.md）。
import { readFileSync } from 'node:fs';

let raw = '';
try {
	raw = readFileSync(0, 'utf8');
} catch {}
let data = {};
try {
	data = JSON.parse(raw || '{}');
} catch {}

const ti = data.tool_input || {};
const fp = String(ti.file_path || ti.path || '')
	.replace(/\\/g, '/')
	.toLowerCase();

if (fp.includes('/jp-code-merge/') || fp.endsWith('/jp-code-merge')) {
	console.error(
		'[block_jp_code_merge_write] 規約5違反: jp-code-agent から jp-code-merge への書き込みは禁止です。' +
			' 接続は endpoint 契約＋データエクスポートのみ（BOUNDARY.md）。対象=' +
			(ti.file_path || ti.path)
	);
	process.exit(2); // block
}
process.exit(0);
