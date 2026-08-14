# ADR 0031: Cursor ハーネスのモデル戦略＝クロスファミリー検証

- Status: Accepted（Supersedes: [[0026]]；Amended by: [[0033]] [[0037]] [[0039]]）
- Date: 2026-07-12
- Context: 精度は「1席あたりのモデルの大きさ」ではなく「独立した検証の深さ」で決まる。
  Cursor では subagent ごとに別ファミリーを割り当てられる。同一ファミリー N 体の多数決は盲点が相関する。
- Decision:
  - **親チャット = Grok 4.5**（[[0033]]）。Claude ゲートは named Task の `model:` で起動。
  - **実装 fan-out = Grok 4.5**（明文化済みタスクのみ）。独立レビューは免除しない。
  - **独立敵対レビュー（全変更）= Claude ゲート・fresh context・敵対的**（`adversarial-review`）。
  - **高リスク検証 = 3体・3ファミリー**（Opus 5 / Grok 4.5 / GPT-5.6 Sol）。過半数確認まで前進不可。
    ファミリー多様性は実装席でなくレビューで稼ぐ。
  - **内省 / 前進判定 / 設計 / plan-confirm = Opus 5**。
  - **不変条件**: 同一 context の自己確認で前進段を満たさない。
  - **製品頭脳を置かない**（[[0039]]）。ハーネスモデルを製品 LLM の代役にしない。
  - 内省時にモデル別の失敗モードを learnings に残し、蓄積後に `model-routing.yaml` へ昇格する。
- Consequences: `.claude/agents/*.md` の `model:` が宣言的に効く。API 予算の席階層は [[0033]]。
- Links: [[0026]] [[0016]] [[0018]] [[0033]] [[0037]] [[0039]]
