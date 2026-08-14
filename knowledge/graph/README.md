# knowledge/graph/ — ハーネス改善グラフ（[[0039]]）

製品の案件グラフではない。skill / Feature / cycle の実行だけを持つ。

| 指標 | 定義 |
| --- | --- |
| node_skip_rate | skipped ノード / 必須ノード |
| edge_skip_rate | skipped 辺 / 必須辺 |
| state_integrity | 終端状態（used\|skipped\|failed\|approved）を持つ必須ノード / 必須ノード |

イベントは `events.jsonl`（追記のみ・canon 外）。必須集合 `required-cycle.json` だけが canon。
記録: `node scripts/cycle-record.mjs`。集計: `node scripts/cycle-metrics.mjs`。
