# ADR 0044: トークン効率（code_mode パケット）と第3レンズ後継

- 状態: 提案
- 改正注記: 第3の現行ピンは [[0046]] で Muse Spark 1.3 medium。Flash medium は予備。code_mode 本体は未実装のまま。
- 日付: 2026-09-04
- 改正対象: [[0031]] [[0033]] [[0037]] [[0040]]。廃止ではない
- 背景:
  OpenAI は Cursor 同梱契約を 2026-11-12 に解消する
  （https://openai.com/index/our-decision-on-cursor-following-its-acquisition-by-spacex/）。
  Astra は移行期間中も Cursor に渡らない。単価比較では Astra / Fable 全面差し替えは枠を食う。
  Uber の Software Factory は spend を 6 項に分解し、ゼロ価値トークンを消す。
  このハーネスに刺さるのは MCP gateway ではなく code_mode
  （照会と中間トレースを scripts 側に置き、モデルには結果パケットだけ渡す）。
- 調査（2026-09-04）:
  - GPT-6 Astra は $10/$50。Codex 長ループでは Sol よりトークンが少ないが、
    このハーネスの第3席は短文レビューなので単価増だけが残る。Task スラッグも無い。
    recurrent depth（opaque recurrence）で内部ループし、書かれた CoT が薄くなる。
    OpenAI 自身も Sol より monitorability が下がったと書く。見える turns / 根拠が減るので
    第3レンズと cycle 計測に向かない。
  - Fable 5.1 は cache read $0.25。天井席の世代ピンだけ妥当。ゲート代替は禁止のまま。
  - Gemini 3.8 Flash は Google 系列、$0.75/$3.50、AA Index 59 で Sol xhigh と同帯。
    この Cloud Agent の Task allowlist にはまだ無い。
  - Composer 2.5 はスラッグがあるが Cursor Models プールで Grok と同居する。第3レンズ禁止。
- 決定:
  1. **席骨格は維持。** 親 Grok 4.6、ゲート Opus 5、第3レンズ現行は GPT-5.6 Sol。
  2. **第3レンズ後継 = Gemini 3.8 Flash（effort medium）。**
     切替は allowlist にスラッグがあり、trio 第3席で1回完走したあと。
     11/12 に間に合わなければ Composer で埋めず 2 ファミリーに一時縮小する。
  3. **Astra はピンしない。** BYOK を正本にしない。
     同梱が来ないことに加え、recurrent depth による観測性低下も却下理由とする。
  4. **Fable 例外席 = 5.1。** 役割は天井のみ。Opus との trio 同居は禁止のまま。
  5. **code_mode。** `scripts/harness-query.mjs` が git / cycle / catalog を照会し、
     上限付き JSON パケットだけを Task に渡す。learnings 全文・ADR 全件・会話は禁則。
     超過は truncate せず失敗。SQLite は使わない。
  6. **計測。** cycle に token_ledger（席 / effort / パケットバイト / Task 数 /
     ゼロ価値再注入）を足す。`$` は推定しない。世代上げは完了あたりで見る。
  7. **effort 方針。** 親・実装 medium、ゲート high、第3 medium、天井 high。
     Task 実在スラッグが high-fast だけの席はスラッグを無理に変えない。
  8. **Composer を第3レンズにしない。**
- 結果: API 枠はゼロ価値再注入を消し、OpenAI 同梱消滅後も 3 ファミリーを捨てない。
  元リポ名は `marumo333-harness`。MIT。jp-code-agent 由来の制約キーは持たない。
- 関連: [[0031]] [[0033]] [[0037]] [[0039]] [[0040]] [[0043]]
