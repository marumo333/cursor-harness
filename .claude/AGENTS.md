# AGENTS.md — ハーネス テンプレート（モデル戦略・自己成長ループ）

製品コードは置かない。ハーネスは **Cursor**。使い方は `TEMPLATE.md`。

## モデル戦略（[[0037]] / [[0033]] / [[0031]]）

精度は独立検証の深さで決まる。ファミリー多様性はレビューで稼ぐ。

| 席 | モデル | 役割 |
| --- | --- | --- |
| 親チャット | Grok 4.5 | 壁打ち・ディスパッチ・統合・cycle 記録 |
| Task ゲート | Opus 5 | plan-confirm / 敵対レビュー / verifier / reflector / 設計 |
| 第3レンズ | GPT-5.6 Sol | 高リスク3体多数決のみ |

親は常時 Grok。Opus は名前付き Task のみ。Sol は3体多数決以外禁止。

## 自己成長ループ（1周）

1. 自走（親 Grok）: knowledge 読込 → brainstorming / writing-plans。並列展開前は plan-confirm。
2. 実装: TDD。親の直接編集は明文化ボイラーのみ。
3. 検証: feature-gate → 独立敵対レビュー。高リスクは 3ファミリー多数決。
4. 内省: reflector が learnings 追記 + Feature 起票。cycle に used/skipped を書く。
5. 成長: OPA allow の Feature だけ skill/ADR/criteria/Rego に適用。
6. ガード: budget_guards / 無制限再起防止。metrics 緑なら再起しない（[[0039]]）。

## ロースター

| agent | model | 責務 |
| --- | --- | --- |
| `backend-architect` | Opus 5 | 設計・ADR・plan-confirm |
| `security-reviewer` | Opus 5 既定 | 独立敵対レビュー。高リスクは Grok / Sol も割当 |
| `verifier` | Opus 5 | feature-gate / テスト / 前進判定 |
| `reflector` | Opus 5 | 内省・Feature 起票 |

製品の構築役（api/ui/db/e2e/auth-billing）はテンプレートに置かない。製品リポ側で足す。
