# ADR 0013: テスト戦略（ハーネス template）

- Status: Accepted（Amended by: [[0039]]）
- Date: 2026-07-04
- Context: このリポは製品コードを持たない。テスト対象は入場ゲート・cycle 指標・OPA 不変条件。
- Decision:
  - **クリティカル領域は TDD 必須**: `feature-gate` / `cycle-metrics` / `policy/*.rego`。
    superpowers の TDD（red→green→refactor）を適用。
  - **例外（人間が明示）**: docs-only / 挙動なしの style / 設定 chore / retrofit。
  - 製品の e2e / vitest / Playwright は製品リポ側。template に置かない。
- Consequences: ゲートと再起条件の回帰を防ぐ。カバレッジ % ノルマは置かない。
- Links: [[0016-definition-of-done]] [[0038]] [[0039]]
