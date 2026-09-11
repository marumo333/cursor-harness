# ADR 0045: ディスパッチ packet（isolated / packet と親の effort 上書き）

- 状態: 提案
- 日付: 2026-09-11
- 改正対象: [[0033]] [[0044]]。廃止ではない。既存 ADR ファイルは上書きしない
- 背景:
  ゲートは isolated（新しい文脈・成果物のみ）だが、親が子に何を継ぐかの語彙が無かった。
  [[0044]] 決定5 の `harness-query` は未実装のまま、bash 一括だけ [[0048]] が入った。
  LangChain の会話 fork を載せると 1周1再注入と独立レビューが溶ける。
- 決定:
  1. **Worker と reflector は `packet`。ゲート（plan-confirm / レビュー / verify）は `isolated`。**
     会話 fork は置かない。親は supervisor として会話を持ってよいが、子へは渡さない。
  2. **照会は `scripts/harness-query.mjs`。** `knowledge/graph/packets/C-NNNN.<node>.<seq>.json`
     （≤32768 バイト、gitignore）。超過は truncate せず失敗。空は書かない。
     禁則キー: `learnings` / `conversation` / `decisions` / `session`。
     `effort` / `escalate` はパケットに載せない。
  3. **親上書きは cycle の dispatch 行が正本。** node / seq / 席 / effort / escalate / sha256。
     seq は周内単調増加。平文 `writer: parent` は信用しない。
     子が同じキーを返したら deny し cycle に残す。
  4. **effort 上書きは許容幅が2要素以上のときだけ。** 幅1は hard deny。
     ゲート effort を親が下げることは不可。実装席を Opus に付け替えない。
  5. **escalate は `stay` / `trio` / `ceiling` / `human`。**
     canon 差分が1件でもある周で `stay` は deny。`ceiling` は追加レビューであり
     verifier / reflector の代替ではない。Muse は trio 第3以外禁止。
  6. **形の正本は `policy/packet.rego`。** deny 集合が空だけを見る。allow 完全ルールは置かない。
     TypeScript / Zod / Pydantic は入れない。
  7. **token_ledger は観測専用。** 席 / effort / パケットバイト / Task 数 / ゼロ価値再注入。
     `$` は推定しない。`need_rerun` の条件を増やさない。
  8. **適用経路。** F-0007 は `proposed`（出生規則）。同一 PR で admitted / approved にしない。
     canon 適用は F-0001（`in_progress` / `supersede_adr: true`）の被覆。
     本 ADR は新規ファイル。`supersede_adr: false`。
- 結果: 子にはリポに落ちた事実の JSON だけが渡り、会話と自己昇格が機械契約で止まる。
- 関連: [[0031]] [[0033]] [[0037]] [[0039]] [[0040]] [[0044]] [[0046]] [[0047]] [[0048]]
