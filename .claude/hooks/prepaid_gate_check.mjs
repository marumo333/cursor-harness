#!/usr/bin/env node
// PostToolUse(Write|Edit): 規約4 — /api の LLM 呼び出しが残高ゲート(reserve→settle)を経由しているか警告。
// ヒューリスティック（非ブロック）。security-reviewer/verify が最終判断。
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
const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
const content = String(ti.content ?? ti.new_string ?? '');
if (!/\/routes\/api\//.test(fp)) process.exit(0);

const callsLlm =
	/(streamText|generateText|createOpenAICompatible|\/v1\/chat\/completions|LlmPort|vllm)/i.test(
		content
	);
const hasGate = /(reserve|settle|creditGate|LedgerPort|balance)/i.test(content);
if (callsLlm && !hasGate) {
	console.error(
		'[prepaid_gate_check] 警告(規約4): ' +
			fp +
			' が LLM を呼んでいるようですが残高ゲート(reserve→settle)が見当たりません。' +
			' 課金ゲートを必ず経由してください（GPU 代暴発防止）。'
	);
}
process.exit(0); // 非ブロック（警告のみ）
