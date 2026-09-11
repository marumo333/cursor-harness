# ADR 0046: 第3レンズ＝Muse Spark 1.3 medium

- 状態: 受理（改正対象: [[0031]] [[0033]] [[0037]] [[0039]] [[0040]] [[0044]]。廃止ではない）
- 日付: 2026-09-11
- 背景:
  OpenAI 同梱は 2026-11-12 提案切れ。[[0044]] は後継を Gemini 3.8 Flash とし、
  切替は Task スラッグ実在 + trio 第3完走のあとと書いた。
  その後 Cursor に Meta の Muse Spark 1.3 が入り、この Cloud Agent の Task allowlist に
  `muse-spark-1.3-medium` がある。人間が Flash を待たず第3席を今すぐ切り替えると指示した。
- 調査（2026-09-11）:
  - Muse は Meta。Opus（Anthropic）とも Grok（Cursor/xAI）とも違う。0031 の3ファミリーが保つ。
  - Composer は Grok と同プール。Fable は Opus と同系列かつガード時に Opus へ落ちる。第3禁止は維持。
  - Flash も独立系列でスラッグがある。0044 の後継候補としては残す。現行ピンは Muse。
  - Kimi / GLM は Desktop にあるが Task スラッグが無い。Qwen は公式カタログに無い。
  - Muse は聞き返し・確認を訓練している。第3席は isolated。質問せず判定だけ返す。
- 決定:
  1. **`review_trio` 第3 = `muse-spark-1.3-medium`。** 役割は秘密漏れ・出力の無害化・allow 信用。
     モード2以外では起動しない。
  2. **GPT-5.6 Sol / Terra / Luna は第3に戻さない。** Router 用にも使わない。
  3. **Gemini 3.8 Flash medium は予備。** Muse の Task スラッグが消えたときだけ、
     新 ADR + Feature（`proposed`）で上げる。Composer で埋めない。
  4. **effort は medium を明示する。** Muse の公式既定 high には上げない。天井は Fable のまま。
  5. **第3は質問しない。** 承認か差し戻しだけ返す。親チャットへ聞き返したら failed。
  6. **0031 / 0033 / 0037 / 0039 は廃止しない。** 第3の世代ピンだけ改正。`supersedes` に載せない。
- 結果: 席骨格は親 Grok + Opus ゲート + 第3は3体のみ。系列は Anthropic / xAI / Meta。
- 関連: [[0031]] [[0033]] [[0037]] [[0039]] [[0040]] [[0044]]
