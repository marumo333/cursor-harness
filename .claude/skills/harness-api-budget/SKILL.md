---
name: harness-api-budget
description: Cursor Pro+ API枠を守る席ルーティング（Grok親・Opus Taskゲート・Solは3体のみ）。壁打ち〜検証の席判断で使う。
---

# harness-api-budget skill（[[0033-harness-api-budget-routing]] / [[0037-opus5-gate-routing]]）

## 席の要約

| 席                   | いつ                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| 親チャット **Grok**  | 常時。壁打ち・調査・下書き・ディスパッチ操作・統合・HOTL 手順                                         |
| Task **Opus 5**      | plan-confirm / auth-billing / 敵対レビュー / ux-reviewer / verifier / reflector / HOTL 診断 / grow 前 |
| Task **Grok**        | api-builder / ui-builder / db-migrator / e2e-runner / best-of-n 実装試行                              |
| Task **GPT-5.6 Sol** | **高リスク3体の第3レンズのみ**（secret/webhook）。他では使わない                                      |

## budget_guards（必ず守る）

1. 親を Opus/Fable にピッカー切替しない。
2. Opus Task 入力は**成果物のみ**（計画 md / diff / 失敗ログ / ADR パス）。会話履歴の丸投げ禁止。
3. Sol は `review_trio`（モード2）以外で起動しない。
4. 3体多数決は高リスク（認証/課金/セキュリティ/アーキ）のみ。
5. plan-confirm は **fan-out 前のみ**必須（単独小修正は省略可。敵対レビューは省略不可）。
6. Opus ゲートは **named agent 必須**。model 未指定の汎用 Task でゲート代替禁止。
7. Fable と Opus を trio に同居させない（Claude 席は1系統・[[0037]]）。
8. Fable は `fable_seat` のみ: 天井判断の追加起動、または auth-billing 実装時の trio lens1 **置換**。ゲート既定代替禁止。

## superpowers 接続

`brainstorming`(親 Grok) → `docs/superpowers/specs/` → `writing-plans`(親 Grok) →
`plan-confirm`(Opus Task) → `parallel-dispatch` → `adversarial-review` → `verify` → `reflect`。

## アーキ（[[0034]]）

- A: `npm run arch:fitness`
- B: adversarial-review の architecture レンズ
- C: 新 Port / 新テーブル・RLS / 横断 feature / 機微 API 契約 → backend-architect 必須（plan-confirm と同一 Task 可）
