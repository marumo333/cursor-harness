# ADR 0014: lint / format / 型

- 状態: 受理（改正: [[0039]]）
- 日付: 2026-07-04
- 背景: template に製品 src は無い。型ゲートを空の `npm run check` で偽装しない。
- 決定:
  - ハーネス scripts は ESM。挙動は `node --test` と `opa test` で見る。
  - 製品リポに切ったあと、そのリポの TypeScript strict / lint を足す。
  - `PUBLIC_` 以外の env をコミットしない（hook で検知）。
- 結果: 型緑の偽シグナルを置かない。
- 関連: [[0016-definition-of-done]] [[0039]]
