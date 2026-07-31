# ADR 0032: 検証・UX・HOTL の subagent 化と CI 外周ゲート

- Status: Accepted（Amended by: [[0033-harness-api-budget-routing]] [[0037-opus5-gate-routing]]）
- Date: 2026-07-12
- Context: DoD（[[0016]]）は Playwright e2e を前進条件にするが未導入だった。UI/UX は [[0017]] が差別化の核なのに
  機械ゲートが無かった。実機運用は learnings に定常手順がなく、創作 skill は harness-grow に反する。
  Cursor では [[0031]] のモデル席分けが使える。
- Decision:
  - **hermetic e2e**: ローカル Supabase + mock LlmPort + Playwright。実行席=`e2e-runner`(Grok・判定しない)。
    鍵は config 評価時に `supabase status` → `webServer.env`（globalSetup より webServer が先起動するため）。
    workers:1・spec ごと独立ユーザー・billing は serial。scripts: `test:e2e`（local wrapper）/
    `test:e2e:ci`（直呼び）。
  - **UX 2層**: 機械=`e2e/ux.spec.ts`（axe / overflow / Linux CI snapshot）。意味=`ux-reviewer`(Opus 5)。
    探索=HOTL plugins（必須ゲートにしない）。criteria: `ux-quality.yaml`。
  - **視覚回帰**: Linux baseline のみ。初回/更新とも `workflow_dispatch --update-snapshots` → artifact 承認 →
    コミット。通常 CI は比較のみ。
  - **HOTL（枠は今・手順は実績から）**: `hotl-ops` skill。事前承認パッケージは全ドメイン共通。
    読取 auto は credential 提供後に限る。実行は**親 Grok 直轄**（ops-runner 不設置・[[0033]]）。
    診断・根因分析は Task(Claude ゲート・既定 Opus 5・[[0037]])。ドメイン2/3はレーン定義のみ。
    記録先=`learnings.md`。インシデント検知は人間起点。実 DB 適用は `db-migrate` に昇格済み。
  - **CI 三層ゲート**: hooks（ローカル）→ verifier/敵対レビュー（ハーネス）→ GitHub Actions（push/PR）。
    hermetic e2e を含む。実機 e2e は CI に入れない。
  - **Cursor harness 依存**: agent `model:` の Grok/Opus/Sol スラッグは Cursor subagent でのみ解決
    （Claude Code から同定義を起動すると失敗しうる）。
- Consequences: DoD の e2e/lint が実体を持つ。運用手順は実績から複利で増える。vite dev e2e と workerd の差は
  `npm run smoke:wrangler`（HOTL・CI 外）で実測可能（2026-07-13 初回: NDJSON 完了まで差なし）。
- Links: [[0016-definition-of-done]] [[0017-workspace-ux]] [[0024-autonomy-modes]]
  [[0031-model-strategy-cursor-multi-family]] [[0033-harness-api-budget-routing]]
