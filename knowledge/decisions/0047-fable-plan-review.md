# ADR 0047: 計画確定と敵対レビュー＝Fable 5.1 high

- 状態: 受理（改正対象: [[0031]] [[0033]] [[0037]] [[0040]] [[0046]]。廃止ではない）
- 日付: 2026-09-11
- 背景:
  plan-confirm と単独敵対レビューは Opus 5 固定だった。人間が
  「計画は Opus で足りるか。レビューは Fable 5.1 の方が的確」と指示した。
  CursorBench 4.0 でも Fable 5.1 は先頭帯。短文の計画破壊とレビューは、
  同じ「抜けを見つける」仕事なので席を分ける理由が薄い。
- 調査:
  - Fable は Anthropic。trio に Opus を残すと 0037 の同居禁止に当たる。
    体1を Fable にし、Opus は trio から外す。
  - verifier / reflector は機械判定と内省。単価は Opus の半分。ここは Opus のまま。
  - Fable はガードに当たると Opus へ落ちる。独立が消えるので、落ちたら failed。
  - 第3は [[0046]] の Muse medium。Sol は現行ピンに残さない。
- 決定:
  1. **plan-confirm と敵対レビュー（モード1・trio 体1）= `claude-fable-5-1-thinking-high`。**
  2. **verifier / reflector = Opus 5 のまま。**
  3. **`review_trio` = Fable 5.1 high / Grok 4.6 / Muse medium。**
     Fable と Opus を同一 trio に置かない（[[0037]]）。
  4. **Fable の Opus フォールバックは failed。** 黙って体1を Opus にしない。
  5. **天井**は Fable extra-high / max の追加レビューだけ。ゲート既定の代替にはしない。
  6. **0031 / 0033 / 0037 は廃止しない。** Claude ゲートの世代ピンだけ改正。
- 結果: 計画とレビューは Fable、検証と内省は Opus、第3は Muse。親は Grok。
- 関連: [[0031]] [[0033]] [[0037]] [[0040]] [[0046]]
