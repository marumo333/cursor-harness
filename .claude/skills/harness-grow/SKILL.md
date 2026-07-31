---
name: harness-grow
description: 内省で見つけた golden path を skill/rule に昇格し、判断を ADR/criteria に落とす。ハーネスを複利成長させる。
---

# harness-grow skill

## 手順

1. `knowledge/learnings.md` の最近の学びから**再利用価値のあるパターン**を抽出。
2. 昇格:
   - 手順化できる → `.claude/skills/<name>/SKILL.md` 新設。
   - 常に守るべき → `CLAUDE.md` 規約 or 該当 agent の禁止事項に追記。
   - 判断基準 → `knowledge/criteria/*.yaml`。設計判断 → `knowledge/decisions/`(ADR 連番)。
3. 独立敵対レビュー（Opus 5・fresh context、`adversarial-review` skill）を通してから昇格（誤学習の混入防止）。
   grow 前の確定判断は Opus Task（親 Grok のまま規約化しない・[[0033]] / [[0037]]）。
4. `harness-audit` を再実行しスコア変化を記録。

## 原則

- 昇格は**検証済みのみ**（learnings の生メモをそのまま規約化しない）。ECC 由来の自己学習を lean に運用。
