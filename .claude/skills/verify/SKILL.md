---
name: verify
description: 完了の定義を機械判定（feature-gate / opa test / cycle 指標 / secret）。タスク検証段で必ず使う。
---

# verify skill（= verifier agent の実体・Opus Task）

親チャットは Grok 4.6 前提（[[0033]] / [[0037]] / [[0040]]）。本 skill の判定主体は `verifier`（Opus 5）または同等の独立呼び出し。

## チェック（全項目合格で「前進可能」・ADR0016）

1. **`node scripts/feature-gate.mjs`**（[[0038]]）。canon 変更は被覆 Feature の OPA apply allow 必須。opa test と cycle 指標テストを含む。
2. ハーネスにテストがある変更は `pnpm test`。製品 src が無いので `pnpm check` / e2e / arch:fitness は置かない。
3. **TDD 赤の証跡**（[[0013]] / `code-quality.yaml`）: 観測可能挙動の変更がある場合、
   `node --test` の**失敗ログ**が検証記録にあること。無い場合は `tdd_exceptions`
   （docs_only / style_only_no_behavior / snapshot_baseline_import / config_chore /
   retrofit_with_human_ack）が明示されていること。どちらも無ければ前進不可。
4. 秘密スキャン（`.claude/hooks/block_secret_write` と二重）。
5. **並列展開案件**: 計画ファイルに `plan_confirm.status: approved` 証跡があること（[[0033]]）。
6. 必須 skill の used/skipped を `cycle` に記録したこと（[[0039]]）。

## 出力

各項目の合格/不合格。**1つでも不合格 → 前進不可**、担当 agent に最小再現付きで差し戻し。
