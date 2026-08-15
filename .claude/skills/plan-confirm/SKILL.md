---
name: plan-confirm
description: 並列展開前の計画確定レビュー（Opus backend-architect）。writing-plans完了直後・parallel-dispatch前に必ず使う。
---

# plan-confirm skill（[[0033]] / [[0037]]）

**適用範囲**: `parallel-dispatch`（実装の並列展開）の**直前のみ必須**。親 Grok の単独小修正では省略可。
文書・誤字のみは対象外。省略しても **敵対レビューは省略不可**。

## 手順

1. superpowers `writing-plans` で計画 md を用意する（親 Grok）。
2. **C トリガ判定**: 次のいずれかなら設計レビュー必須。
   - Feature 正本 / OPA / cycle 再起条件の変更
   - 複数 skill・policy にまたがる横断変更
   - hooks や GitHub Actions の強制点
3. `backend-architect` を **Task（Opus 5・新しい文脈）**で起動。入力は**計画 md のみ**（＋必要なら関連 ADR パス）。
   会話履歴は渡さない。実装禁止。
   - 非 C: 「壊せ／抜け／リスク。承認か差し戻しのみ」
   - C: 上記＋「境界・正本・再起の有界性・ADR 要否。設計不足なら差し戻し」
4. **承認** 時のみ並列展開可。計画ファイルに証跡を書く:

```yaml
plan_confirm:
  status: approved
  agent: backend-architect
  at: 2026-08-14T00:00:00Z
  c_trigger: false
```

5. 差し戻し → 親 Grok が計画を直して再提出（同じ手順・新しい文脈）。
6. `verify` は並列展開案件でこの証跡を確認する（[[0016]]）。
