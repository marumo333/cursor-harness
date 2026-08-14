# ADR 0013: テスト戦略（ハーネス template）

- 状態: 受理（改正: [[0039]]）
- 日付: 2026-07-04
- 背景: このリポは製品コードを持たない。テスト対象は入場ゲート・cycle 指標・OPA 不変条件。
- 決定:
  - **クリティカル領域は TDD 必須**: `feature-gate` / `cycle-metrics` / `policy/*.rego`。
    superpowers の TDD（赤→緑→整理）を適用。
  - **例外（人間が明示）**: docs-only / 挙動なしの style / 設定 chore / retrofit。
  - 製品の e2e / vitest / Playwright は製品リポ側。template に置かない。
- 結果: ゲートと再起条件の回帰を防ぐ。カバレッジ % ノルマは置かない。
- 関連: [[0016-definition-of-done]] [[0038]] [[0039]]
