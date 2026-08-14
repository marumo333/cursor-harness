---
name: cycle
description: 1周の skill 使用/skip をグラフに記録し、3指標を出す。ループ終了時に必ず使う。
---

# cycle skill（[[0039]]）

hooks から Task は起動しない。親が各 skill のあと（または Stop 前）に記録する。

## 必須ノード（`knowledge/graph/required-cycle.json`）

`harness-api-budget` / `adversarial-review` / `verify` / `reflect`

使ったら:

`node scripts/cycle-record.mjs --type node_state --cycle C-0001 --node skill:<name> --state used`

使わなかったら `--state skipped`。失敗は `--state failed`。

辺（handoff）:

`node scripts/cycle-record.mjs --type edge_state --cycle C-0001 --from skill:verify --to skill:reflect --state taken|skipped --reason '...'`

## 集計

`node scripts/cycle-metrics.mjs --cycle C-0001`

`should_file_feature=true` なら reflector が Feature を proposed で起票する（直接 skill を書き換えない）。

## 再起

人間が PR をマージしたあと `cycle-after-merge` が次票を起票する。metrics 緑なら止める。
未マージの `cycle/*` PR がある、または `gh` で確認できないときも止める。
