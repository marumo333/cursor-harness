#!/usr/bin/env node
// PreToolUse(Bash): git commit 前に 規約6 — 型チェック緑 + secret スキャンを強制。
// 依存未インストール時は型チェックをスキップ（基盤未準備で全 commit を止めない）。
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

let raw = '';
try {
	raw = readFileSync(0, 'utf8');
} catch {}
let data = {};
try {
	data = JSON.parse(raw || '{}');
} catch {}

const cmd = String((data.tool_input && data.tool_input.command) || '');
if (!/\bgit\s+commit\b/.test(cmd)) process.exit(0);

// 1) staged に実 .env が無いか
try {
	const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean);
	const badEnv = staged.find(
		(f) => /(^|\/)\.env(\.[a-z]+)?$/.test(f) && !/\.env\.example$/.test(f)
	);
	if (badEnv) {
		console.error(
			'[pre_commit_guard] 規約1: 実 .env(' + badEnv + ') をステージしています。除外してください。'
		);
		process.exit(2);
	}
} catch {}

// 2) 型チェック（製品 src と依存があるときだけ）
if (existsSync('node_modules') && existsSync('package.json') && existsSync('src')) {
	try {
		execSync('npm run check', { stdio: 'pipe', encoding: 'utf8' });
	} catch (e) {
		console.error(
			'[pre_commit_guard] 規約6: 型チェック(npm run check)が失敗。緑にしてから commit してください。\n' +
				String((e && (e.stdout || e.message)) || '').slice(0, 2000)
		);
		process.exit(2);
	}
}

// 3) Feature 正本 + OPA 入場（[[0038]]）。stdout は hook JSON を汚さない。
try {
	execSync('node scripts/feature-gate.mjs', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
	console.error('[pre_commit_guard] feature-gate が失敗。canon 変更は Feature + OPA allow が必要。');
	console.error(String((e && (e.stderr || e.stdout || e.message)) || '').slice(0, 4000));
	process.exit(2);
}
process.exit(0);
