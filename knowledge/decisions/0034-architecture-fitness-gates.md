# ADR 0034: アーキテクチャ適合ゲート（廃止）

- 状態: 廃止（後継 [[0039-harness-template-cycle-graph]]）
- 日付: 2026-07-13
- 背景: 層崩れを `arch:fitness` で見ていた。ハーネスの構造ゲートは Feature 正本 + OPA + cycle に閉じる。
- 決定: **撤回。** `scripts/arch-fitness.mjs` と `architecture-fitness.yaml` は置かない。
  ハーネスの構造ゲートは Feature 正本 + OPA + cycle グラフ（[[0038]] / [[0039]]）。
  構造レンズは `adversarial-review` に残す（正本迂回・再起の無制限化）。
- 結果: 構造検査は adversarial-review のレンズに閉じる。
- 関連: [[0039-harness-template-cycle-graph]] [[0016-definition-of-done]]
