# ADR 0041: パッケージマネージャ＝pnpm

- 状態: 受理（改正対象: [[0014]] [[0016]]）
- 日付: 2026-08-15
- 背景: ハーネスと複製先が `npm` を前提にしていた。npm の供給連鎖インシデントが多く、
  依存ゼロの今でも複製先が npm を継承する。テスト起動は `node --test` だが、
  パッケージマネージャの正本は揃えておく。
- 決定:
  - **パッケージマネージャ＝pnpm**（`packageManager` をピン留め）。
  - ハーネスのテスト起動は `pnpm test`（中身は `node --test`）。
  - 型ゲートを空の `pnpm run check` で偽装しない（[[0014]]）。製品 src が無い間は check を置かない。
    `pnpm check` は script 欠落時に PATH 上の `check` を実行するので使わない。
  - ローカルのテスト起動は `pnpm test`（中身は `node --test`）。CI も `node --test` を直接呼ぶ。
  - hooks / 完了の定義の文書は npm を残さない。
  - settings の allow に `pnpm` も `node --test:*` も置かない。
    テスト起動の自動承認は `node --test scripts/cycle-metrics.test.mjs` の完全一致だけ。
- 結果: 複製先も pnpm を継承する。`node scripts/*` はそのまま。
- 関連: [[0014]] [[0016]] [[0039]]
