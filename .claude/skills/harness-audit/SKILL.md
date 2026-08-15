---
name: harness-audit
description: ハーネス健全性を決定的にスコア化し履歴に記録。実行するほど成長しているかを可視化する。
---

# harness-audit skill

## スコア項目（決定的・0-100）

- ルール網羅: CLAUDE.md の禁止が hooks/agent で強制されているか。
- knowledge 充足: ADR に未解決の重要判断が残っていないか・criteria が最新か。
- **席割当の整合（[[0033]] / [[0037]] / [[0040]]）**: `model-routing.yaml` の chat_orchestrator=Grok・grok_task・opus_gates・
  review_trio(Opus/Grok/Sol)・budget_guards が AGENTS / skills / `.claude/agents/*.md` 先頭事項と矛盾していないか。
- **製品ゼロ（[[0039]]）**: 認証/課金/UI/DB/e2e/HOTL/配信の agent・skill・hook・criteria が再混入していないか。
- **cycle 整合（[[0039]]）**: required-cycle の必須ノードが記録され、3指標が出せるか。
- セキュリティ: security-policy.yaml 各項目（OWASP LLM/Agentic Top10）。
- 学習: learnings が更新され、再現可能な改善が Feature 正本に起票され、OPA allow のうえ成功経路が昇格されているか（[[0038]]）。
- **feature/OPA 整合**: `opa test policy/` 緑、`knowledge/features/` が型を満たす、canon 差分が票で被覆されているか。

## 実行席

監査の集計・文書突合は親 Grok で可。判定に迷う項目は Opus Task。

## 出力

合計スコア＋内訳を `knowledge/benchmarks/audit-<n>.json` に追記（`Date.now` は使わずカウンタ連番）。
前回比の増減を報告。**下降時は原因（劣化した項目）を明示**。
