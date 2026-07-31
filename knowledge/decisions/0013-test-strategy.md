# ADR 0013: テスト戦略（実用バランス + behavior-change TDD）

- Status: Accepted
- Date: 2026-07-04
- Amended: 2026-07-17
- Context: コード品質バー=実用バランス。全レイヤーの unit TDD は個人開発に過剰、テスト皆無は認証/課金で危険。
  一方、UI/feature を「速度のため TDD 対象外」にすると、テスト後付け・実装先行が常態化しハーネスの複利成長を壊す。
- Decision:
  - **クリティカル領域は TDD 必須（維持）**: 認証/セッション、認可・課金(reserve→settle)、`ports`/`repositories`、
    Stripe webhook、RLS。superpowers の TDD（red→green→refactor）を適用。
  - **観測可能な製品挙動の変更も TDD 必須（2026-07-17 追加）**: feature / bugfix / 新規 e2e 契約は、
    失敗テストを `e2e-runner`（Playwright）または vitest で**観測してから**最小実装する。
    UI の RED は hermetic Playwright でよい（全 Svelte の unit 必須ではない）。
  - **例外（人間が明示）**: docs-only / 挙動なしの style・copy / snapshot baseline 取り込み /
    設定 chore / 明示 throwaway / retrofit（実装とテストが既に同時にある WT を載せるだけ）。
  - **services はインテグレーションテスト**（Supabase ローカル or モック）。
  - **主要ユーザーフローは e2e**（Playwright・`verify` skill）。
  - **純ロジック(domain/utils)は unit（vitest）**。UI コンポーネント unit は軽め（重要 widget のみ）。
- Consequences: 危険領域の回帰を防ぎつつ、挙動変更では red 証跡が DoD の一部になる。
  「テスト後付けで緑にした」は前進段を満たさない（例外ラベルなし）。カバレッジ % ノルマは置かない。
- Links: [[0016-definition-of-done]] [[0004-prepaid-billing]]
