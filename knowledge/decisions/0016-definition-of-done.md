# ADR 0016: 完了の定義

- 状態: 受理（改正: [[0037]] [[0038]] [[0039]]）
- 日付: 2026-07-04
- 背景: 自己成長ループの「検証」段が何を満たせば前進可能かを機械的に定義する（`criteria/code-quality.yaml`）。
- 決定: あるタスクが **完了** とみなせるのは全て満たす時:
  1. **`node scripts/feature-gate.mjs` が緑**（opa test + cycle 指標テスト + 被覆 Feature の apply allow）。
  2. ハーネスにテストがある変更は `npm test` が緑。製品 src が無いので型チェック / e2e / arch:fitness は置かない。
  3. **挙動変更タスクは TDD 赤の証跡**（`node --test` の失敗ログ）があること。
     例外は `criteria/code-quality.yaml` の `tdd_exceptions` を人間が明示した場合のみ（[[0013]]）。
  4. 秘密スキャン通過（`PUBLIC_`以外の鍵がクライアント/コミットに無い）。
  5. **独立敵対レビュー通過**（実装と別 agent・新しい文脈・「壊せ」視点）。
     高リスクは Opus 5 / Grok / GPT-5.6 Sol の3体多数決。自己レビューは前進段を満たさない（[[0031]] / [[0037]]）。
  6. **並列展開する場合は plan-confirm 承認証跡**が計画ファイルにあること（[[0033]]）。
  7. **`knowledge/learnings.md` に内省を追記**し、判断に触れた場合は Feature 正本を起票（[[0038]]）。
  8. **必須 skill の used/skipped を `knowledge/graph/events.jsonl` に記録**（[[0039]]）。
- 結果: 「動いたつもり」で前進しない。製品リポに切ったあと、そのリポの型/e2e を完了条件に足してよい。
- 関連: [[0013-test-strategy]] [[0031]] [[0033]] [[0037]] [[0038]] [[0039]]
