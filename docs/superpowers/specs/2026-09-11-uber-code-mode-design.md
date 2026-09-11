# Uber code-mode（bash 一括 + 要約）— 2026-09-11

記事: [Running a Software Factory Efficiently at Uber Scale](https://www.uber.com/us/en/blog/efficient-software-factory/)

## 何を入れるか

ツールをシェル経由にし、**複数の bash を 1 スクリプト / 1 回の CLI で回す**。中間の stdout はモデル文脈に載せない。返すのは上限付き JSON 要約だけ。後続 turn の prefix が短く安定し、read_cache（prompt cache）が効きやすい。

0044 の `harness-query`（catalog / cycle 照会パケット）は **別物**。F-0007 のまま未実装。本票は記事の Code-Mode（bash 一括）だけ。

## 固定

| 項目 | 値 |
| --- | --- |
| CLI | `node scripts/code-mode.mjs --step '…'` を 2 本以上 |
| 超過 | truncate せず非ゼロ |
| 空 | 書かない |
| 単発 bash | 可（1 事実） |
| 2+ 照会の `&&` / `;` 生連鎖 | hook が deny。CLI へ誘導 |
| 書き込み / commit | code-mode 強制しない。commit-guard は外側コマンド文字列も見る |
| Task 点火 | hooks からしない |
| Anthropic cache TTL | 触らない（Cursor ランタイム） |
| 適用 | F-0001。F-0010 は proposed |

## やらない

- MCP gateway、SQLite、Python サブプロセス専用ランタイム
- F-0007 の入場と `harness-query`
- 将来 turn を hook が勝手に結合すること（できない。1 回の CLI に書かせる）
