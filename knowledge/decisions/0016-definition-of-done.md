# ADR 0016: Definition of Done（完了の定義）

- Status: Accepted（Amended by: [[0037-opus5-gate-routing]] [[0038-feature-canon-opa-grow]]）
- Date: 2026-07-04
- Context: 自己成長ループの「検証」段が何を満たせば前進可能かを機械的に定義する（`criteria/code-quality.yaml`）。
- Decision: あるタスクが **Done** とみなせるのは全て満たす時:
  1. `npm run check`（型）が緑。
  2. lint / format 通過。
  3. **クリティカル領域はテスト追加＆緑**（[[0013-test-strategy]]）。該当フローがあれば e2e も緑。
  4. **挙動変更タスクは TDD red 証跡**（`e2e-runner` または vitest の失敗ログ）があること。
     例外は `criteria/code-quality.yaml` の `tdd_exceptions` を人間が明示した場合のみ（[[0013-test-strategy]]）。
  5. secret スキャン通過（`PUBLIC_`以外の鍵がクライアント/コミットに無い）。
  6. **`npm run arch:fitness` 通過**（[[0034-architecture-fitness-gates]]）。
  7. **独立敵対レビュー通過**（実装と別 agent・fresh context・「壊せ」視点＝Opus 5 `verifier` /
     `security-reviewer`。高リスクは Opus 5 / Grok / GPT-5.6 Sol の3体・3ファミリー多レンズ多数決で過半数確認）。
     **自己レビューは前進段を満たさない**（[[0031-model-strategy-cursor-multi-family]] / [[0037-opus5-gate-routing]]）。
  8. **fan-out（`parallel-dispatch`）を行う場合は plan-confirm approve 証跡**が計画ファイルにあること
     （[[0033-harness-api-budget-routing]]）。
  9. **`knowledge/learnings.md` に内省を追記**（判断に触れた場合は Feature 正本を起票し、
     OPA 入場後に ADR/criteria/skill/Rego を更新・[[0038]]）。
  10. **canon を mutate する変更は `node scripts/feature-gate.mjs` が緑**（被覆 Feature +
     `grow.admission` allow）。
- Consequences: 「動いた"つもり"」で前進しない。ループの前進ガードとして hook/skill が参照。
- Links: [[0013-test-strategy]] [[0014-lint-format-types]] [[0015-errors-naming]]
  [[0031-model-strategy-cursor-multi-family]] [[0033-harness-api-budget-routing]]
  [[0034-architecture-fitness-gates]] [[0037-opus5-gate-routing]]
  [[0038-feature-canon-opa-grow]]
