---
name: reflect
description: タスク後の内省（効いた/失敗/境界事例を言語化し learnings に追記）。自己成長ループ④の入口。
---

# reflect skill（= reflector agent・Opus Task）

自己成長ループ④の入口（[[0033]] / [[0039]]）。親 Grok が本 skill を読み、`reflector` を Task 起動する。
入力は成果物のみ（差分要約・レビュー結果・失敗ログ）。

## 手順（3相）

1. 実行結果を評価: `worked` / `failed` / `edge cases` を箇条書き（人が読む本文は日本語）。
2. `knowledge/learnings.md` に日付付きで追記（製品日記は書かない）。
3. 再現可能な判断は `knowledge/features/F-NNNN-*.yaml` に **proposed で起票**する（正本・[[0038]]）。
   起票後に `harness-grow` へ渡す。skill/ADR/criteria/Rego はここでは書き換えない。
4. 必須 skill の used/skipped を `cycle` skill で記録する。

## モデル別観点（[[0031]]）

- **どの席（モデル）がどんなタスクで差し戻されたか**を記録する。
- 蓄積が溜まったら `knowledge/criteria/model-routing.yaml` のルーティング規則に昇格する。

## 原則

- 具体的に（「ゲートが失敗した」でなく「deny 空を見ず allow を信じた」）。
- 既存 ADR を覆す時は新 ADR＋`Supersedes`（Feature の `constraints.supersede_adr: true`）。
- 正本は Feature。learnings は日記。GitHub Issue は鏡にできるが正本にしない。
