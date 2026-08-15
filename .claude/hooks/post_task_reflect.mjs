#!/usr/bin/env node
// Stop: 自己成長ループ — 内省と cycle 記録を促す（非ブロック。Task は起動しない）。
console.error(
	'[post_task_reflect] 自己成長ループ④: reflector Task(Opus 5) を起動し、knowledge/learnings.md に' +
		'「効いた/失敗/境界事例」を追記。再現可能な改善は knowledge/features/F-NNNN-*.yaml に正本起票' +
		'（直接昇格しない）。入場は node scripts/feature-gate.mjs --admit。適用は harness-grow（[[0038]]）。' +
		'必須 skill の used/skipped は node scripts/cycle-record.mjs（cycle skill・[[0039]]）。' +
		'（親は Grok・内省は Opus Task・hooks から Task 起動禁止・[[0033]] / [[0037]]）'
);
process.exit(0);
