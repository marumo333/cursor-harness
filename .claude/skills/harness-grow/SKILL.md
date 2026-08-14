---
name: harness-grow
description: 入場済み Feature だけ skill/rule/Rego に昇格し、判断を ADR/criteria に落とす。ハーネスを複利成長させる。
---

# harness-grow skill

## 手順

1. `knowledge/features/` の `proposed` / `admitted` / `in_progress` を読む。learnings 生メモは正本ではない。
2. 敵対レビュー（Opus 5・fresh context、`adversarial-review` skill）を通し、
   `evidence.adversarial_review: approved` を票に書く。grow 前の確定判断は Opus Task
   （親 Grok のまま規約化しない・[[0033]] / [[0037]]）。
3. `node scripts/feature-gate.mjs --admit knowledge/features/F-NNNN-….yaml` が allow なら
   `status: admitted`。deny なら票を直す（黙って skill を書かない）。
4. 昇格（`apply`。対象は票の `proposed_change.paths` のみ）:
   - 手順化できる → `.claude/skills/<name>/SKILL.md` 新設。
   - 常に守るべき → `CLAUDE.md` 規約 or 該当 agent の禁止事項に追記。
   - 判断基準 → `knowledge/criteria/*.yaml`。設計判断 → `knowledge/decisions/`(ADR 連番)。
   - **決定的不変条件** → `policy/learned/*.rego` + `*_test.rego`（kind=`harness-rule`）。
5. `node scripts/feature-gate.mjs` 緑を確認し、票を `done` にする。
6. `harness-audit` を再実行しスコア変化を記録。

## 原則

- 昇格は**検証済みかつ OPA allow のみ**（learnings の生メモをそのまま規約化しない）。
- Feature が正本（[[0038]]）。GitHub Issue / Spec Kit は正本にしない（[[0033]]）。
- ECC 由来の自己学習を lean に運用。OPA に内省文を生成させない。
