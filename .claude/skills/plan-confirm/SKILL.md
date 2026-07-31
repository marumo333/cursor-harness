---
name: plan-confirm
description: fan-out前の計画確定レビュー（Opus backend-architect）。writing-plans完了直後・parallel-dispatch前に必ず使う。
---

# plan-confirm skill（[[0033-harness-api-budget-routing]] / [[0037-opus5-gate-routing]]）

**適用範囲**: `parallel-dispatch`（実装 fan-out）の**直前のみ必須**。親 Grok の単独小修正では省略可。
docs/typo のみは対象外。省略しても **敵対レビューは省略不可**。

## 手順

1. superpowers `writing-plans` で計画 md を用意する（親 Grok）。
2. **C トリガ判定**（[[0034]]）: 次のいずれかなら設計レビュー必須。
   - 新 Port / ports.ts 契約追加
   - 新テーブル・RLS
   - 横断 feature（複数スライス/層にまたがる）
   - 機微 API（`/api/chat` 等）の契約変更
3. `backend-architect` を **Task（Opus 5・fresh context）**で起動。入力は**計画 md のみ**（＋必要なら関連 ADR パス）。
   会話履歴は渡さない。実装禁止。
   - 非 C: 「壊せ／抜け／リスク。approve か差し戻しのみ」
   - C: 上記＋「境界・Port・RLS・ADR 要否。設計不足なら差し戻し」
4. **approve** 時のみ fan-out 可。計画ファイルに証跡を書く:

```yaml
plan_confirm:
  status: approved
  agent: backend-architect
  at: 2026-07-13T00:00:00+09:00
  c_trigger: false
```

5. 差し戻し → 親 Grok が計画を直して再提出（同じ手順・新 context）。
6. `verify` は fan-out 案件でこの証跡を確認する（[[0016]]）。

## 禁止

- 専用 plan-confirm agent の新設（ロースター肥大化）。
- model 未指定の汎用 Task で本ゲートを代替すること。
- approve なしで parallel-dispatch すること。
