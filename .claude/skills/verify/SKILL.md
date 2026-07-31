---
name: verify
description: Definition of Done を機械判定（型/lint/arch-fitness/Playwright e2e/secret/課金ゲート）。タスク検証段で必ず使う。
---

# verify skill（= verifier agent の実体・Opus Task）

親チャットは Grok 前提（[[0033]] / [[0037]]）。本 skill の判定主体は `verifier`（Opus 5）または同等の独立呼び出し。

## チェック（全 pass で「前進可能」・ADR0016）

1. `npm run check`（型緑）。
2. lint/format（ESLint/Prettier/svelte-check）— `npm run lint`。
3. **`npm run arch:fitness`**（[[0034]]）。
4. クリティカル領域テスト（認証/課金/認可/ports・vitest）。
   4b. **TDD red 証跡**（[[0013]] / `code-quality.yaml`）: 観測可能挙動の変更がある場合、
   `e2e-runner` または vitest の**失敗ログ**が検証記録にあること。無い場合は `tdd_exceptions`
   （docs_only / style_only_no_behavior / snapshot_baseline_import / config_chore /
   retrofit_with_human_ack）が明示されていること。どちらも無ければ前進不可。
5. e2e（分割）:
   - **hermetic（必須ゲート）**: `npm run test:e2e` / CI では `test:e2e:ci`。実行は `e2e-runner`、判定は verifier。
   - **UI 変更時**: `ux-reviewer` approve ＋ `e2e/ux.spec.ts` 緑（`ui-builder` 成果物がある変更は必須）。
   - **実機 e2e（HOTL・マイルストーン）**: `hotl-ops` ドメイン1。必須ゲートではない。
6. secret スキャン（`.claude/hooks/block_secret_write` と二重）。
7. `prepaid_gate_check` 警告ゼロ（/api の LLM 呼が残高ゲート経由）。
8. **fan-out 案件**: 計画ファイルに `plan_confirm.status: approved` 証跡があること（[[0033]]）。
9. マイニング/抽出プロンプト・スキーマ関連の変更は、実 `LlmPort`（Qwen3.6-27B 実機）への golden fixture 評価
   （入力サンプル→期待候補）pass が前進条件。結果は `knowledge/benchmarks/` に記録（[[0031]]・ハーネスモデルを
   製品頭脳の代役にしない）。※ M2 でマイニング実装が入るまでは対象変更が存在しないためスキップ可。

## 出力

各項目 pass/fail。**1つでも fail → 前進不可**、担当 agent に最小再現付きで差し戻し。
