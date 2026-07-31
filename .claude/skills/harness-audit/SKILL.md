---
name: harness-audit
description: ハーネス健全性を決定的にスコア化し履歴に記録。実行するほど成長しているかを可視化する。
---

# harness-audit skill

## スコア項目（決定的・0-100）

- ルール網羅: CLAUDE.md 規約1-13 が hooks/agent 禁止事項で強制されているか。
- knowledge 充足: PRD 有り・ADR に未解決の重要判断が残っていないか・criteria が最新か。
- **routing 整合（[[0033]] / [[0037]]）**: `model-routing.yaml` の chat_orchestrator=Grok・opus_gates・
  review_trio(Opus/Grok/Sol)・budget_guards が AGENTS / skills / `.claude/agents/*.md` frontmatter /
  ルーティング ADR（0016/0018/0031/0032/0033/0037）と矛盾していないか。
  `claude-fable` の残存は `fable_exception`・明示禁止文・履歴 ADR / 過去の plan・learnings 以外にあってはならない。
- **arch fitness 文書整合（[[0034]]）**: `arch:fitness` が verify/0016/code-quality に載っているか。
- 検証網羅: クリティカル領域(認証/課金/認可)のテスト有無・e2e カバレッジ。
- セキュリティ: security-policy.yaml 各項目の実装状況（OWASP LLM/Agentic Top10）。
- 学習: learnings が更新され golden path が昇格されているか。

## 実行席

監査の集計・文書突合は親 Grok で可。判定に迷う項目は Opus Task。

## 出力

合計スコア＋内訳を `knowledge/benchmarks/audit-<n>.json` に追記（`Date.now` は使わずカウンタ連番）。
前回比の増減を報告。**下降時は原因（劣化した項目）を明示**。
