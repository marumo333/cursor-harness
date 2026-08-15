# knowledge/graph/ — ハーネス改善グラフ（[[0039]]）

製品の案件グラフではない。skill / Feature / cycle の実行だけを持つ。

| 指標 | 定義 |
| --- | --- |
| node_skip_rate（ノード省略率） | 省略した必須ノード / 必須ノード |
| edge_skip_rate（辺省略率） | 省略した必須辺 / 必須辺 |
| state_integrity（状態の完全性） | 終端状態（使用 / 省略 / 失敗 / 承認）を持つ必須ノード / 必須ノード |

イベントは `events.jsonl`（追記のみ・canon 外）。必須集合 `required-cycle.json` だけが canon。
記録: `node scripts/cycle-record.mjs`。集計: `node scripts/cycle-metrics.mjs`。
