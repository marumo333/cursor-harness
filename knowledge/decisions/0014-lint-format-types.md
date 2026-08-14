# ADR 0014: lint / format / 型

- Status: Accepted（Amended by: [[0039]]）
- Date: 2026-07-04
- Context: template に製品 src は無い。型ゲートを空の `npm run check` で偽装しない。
- Decision:
  - ハーネス scripts は ESM。挙動は `node --test` と `opa test` で見る。
  - 製品リポに切ったあと、そのリポの TypeScript strict / lint を足す。
  - `PUBLIC_` 以外の env をコミットしない（hook で検知）。
- Consequences: 型緑の偽シグナルを置かない。
- Links: [[0016-definition-of-done]] [[0039]]
