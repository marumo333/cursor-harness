# ADR 0037: ハーネス Claude ゲート席＝Opus 5（骨格は 0033 維持）

- 状態: 受理（改正対象: [[0033]] [[0031]]；改正: [[0039]]）
- 日付: 2026-07-24
- 背景: Claude Opus 5 GA。0033 の枠（親 Grok＋Claude ゲート集中）を維持しつつゲート既定を Opus 5 にする。
- 決定:
  - **Claude ゲート席の既定 = Opus 5**（`claude-opus-5-thinking-high`）。
    対象: `backend-architect` / `security-reviewer` / `verifier` / `reflector` /
    単独敵対レビュー・grow 前レビュー・plan-confirm。
  - **親チャット＝Grok 4.5 据え置き**。
  - **実装の並列展開＝Grok 4.5 据え置き**。
  - **`review_trio`＝Opus 5 / Grok 4.5 / GPT-5.6 Sol**。Fable と Opus を同一 trio に同居させない。
  - **Fable 5 は既定ロースターから外す**。許可は天井判断の追加レビューのみ。ゲート既定代替には使わない。
  - **不変条件**: 独立した新しい文脈・敵対的レビュー、名前付き agent 必須、Opus Task 入力は成果物のみ。
- 結果: 製品 agent（auth-billing / ux-reviewer）はテンプレートに置かない（[[0039]]）。
- 関連: [[0031]] [[0033]] [[0026]] [[0016]] [[0018]] [[0039]]
