# ADR 0048: Uber code-mode＝bash 一括と要約

- 状態: 受理（改正対象: [[0044]] [[0033]]。廃止ではない）
- 日付: 2026-09-11
- 背景:
  人間が Ultra でもトークン効率と精度を同時に取ると指示した。
  Uber Software Factory の Code-Mode は、ツールをシェルにし、複数アクションを
  1 スクリプトで回して中間結果を文脈に載せない。read_cache は後続 turn の
  prefix が短く安定することで効く。0044 はこれを `harness-query` パケットに
  読み替えて未実装のまま残していた。
- 調査:
  - Cursor の `beforeShellExecution` は今のコマンドを allow / deny するだけ。
    未来の turn を結合できない。2 本以上は CLI 1 回に書かせ、生の照会連鎖を deny する。
  - Anthropic の cache TTL はランタイム側。ハーネスは触らない。
  - commit-guard は外側のコマンド文字列を見る。code-mode の `--step` 内の
    `--no-verify` も同じ文字列に載るので既存 deny が効く。
- 決定:
  1. **2 本以上の照会 bash は `node scripts/code-mode.mjs --step` 1 回。**
     返すのは上限付き JSON 要約。超過は truncate せず失敗。空は書かない。
  2. **生の 2+ 照会 `&&` / `;` 連鎖は hook deny。** 単発照会と書き込み / commit は強制しない。
  3. **0044 の harness-query は別。** F-0007。本票は bash 一括だけ。
  4. **hooks から Task を起動しない。**
  5. **適用経路。** F-0010 は `proposed`。canon 適用は F-0001。
- 結果: 照会の N turn が 1 CLI になり、中間トレースが文脈に残らない。
- 関連: [[0033]] [[0044]] [[0018]]
