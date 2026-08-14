#!/usr/bin/env node
// Stop: 規約8/自己成長ループ — タスク一区切りで内省→knowledge 更新を促す（非ブロック）。
console.error(
	'[post_task_reflect] 自己成長ループ④: reflector Task(Opus 5) を起動し、knowledge/learnings.md に' +
		'「効いた/失敗/edge case」を追記。再現可能な改善は knowledge/features/F-NNNN-*.yaml に正本起票' +
		'（直接昇格しない）。入場は node scripts/feature-gate.mjs --admit。適用は harness-grow（[[0038]]）。' +
		'（親は Grok・内省は Opus Task・[[0033]] / [[0037]]）'
);
process.exit(0);
