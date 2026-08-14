---
name: harness-api-budget
description: Cursor Pro+ API枠を守る席ルーティング（Grok親・Opus Taskゲート・Solは3体のみ）。壁打ち〜検証の席判断で使う。
---

# harness-api-budget skill（[[0033]] / [[0037]] / [[0039]]）

## 席の要約

| 席                   | いつ                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| 親チャット **Grok**  | 常時。壁打ち・調査・下書き・ディスパッチ操作・統合・cycle 記録       |
| Task **Opus 5**      | plan-confirm / 敵対レビュー / verifier / reflector / 設計 / grow 前  |
| Task **Grok**        | 明文化済みの実装並列展開 / 複数試行                                  |
| Task **GPT-5.6 Sol** | **高リスク3体の第3レンズのみ**（secret）。他では使わない             |

製品の構築役（auth-billing / ui / db / e2e）はテンプレートに置かない。

## budget_guards（必ず守る）

1. 親を Opus/Fable にピッカー切替しない。
2. Opus Task 入力は**成果物のみ**（計画 md / diff / 失敗ログ / ADR パス）。会話履歴の丸投げ禁止。
3. Sol は `review_trio`（モード2）以外で起動しない。
4. 3体多数決は高リスク（セキュリティ/入場/再起/アーキ）のみ。
5. plan-confirm は **並列展開前のみ**必須（単独小修正は省略可。敵対レビューは省略不可）。
6. Opus ゲートは **名前付き agent 必須**。model 未指定の汎用 Task でゲート代替禁止。
7. Fable と Opus を trio に同居させない（Claude 席は1系統・[[0037]]）。
8. Fable は `fable_seat` のみ: 天井判断の追加起動。ゲート既定代替禁止。

## superpowers 接続

`brainstorming`(親 Grok) → `writing-plans`(親 Grok) →
`plan-confirm`(Opus Task, 並列展開時) → `parallel-dispatch` → `adversarial-review` → `verify` → `reflect`。

使ったら `cycle` skill で node/edge を記録する。
