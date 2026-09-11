---
name: cycle
description: 1周の skill 使用/省略をグラフに記録し、3指標を出す。ループ終了時に必ず使う。
---

# cycle skill（[[0039]]）

hooks から Task は起動しない。親が各 skill のあと（または Stop 前）に記録する。

## 必須ノード（`knowledge/graph/required-cycle.json`）

`harness-api-budget` / `adversarial-review` / `verify` / `reflect`

使ったら:

`node scripts/cycle-record.mjs --type node_state --cycle C-0001 --node skill:<name> --state used`

使わなかったら `--state skipped`。失敗は `--state failed`。

辺（受け渡し）:

`node scripts/cycle-record.mjs --type edge_state --cycle C-0001 --from skill:verify --to skill:reflect --state taken|skipped --reason '...'`

## ディスパッチと観測（[[0045]]）

親が子を起動する直前:

`node scripts/harness-query.mjs --cycle C-NNNN --node skill:verify --context-mode isolated --feature F-NNNN --adr knowledge/decisions/0045-dispatch-context-packet.md`

`node scripts/cycle-record.mjs --type dispatch --cycle C-NNNN --node skill:verify --seq 1 --seat opus --escalate stay --sha256 <packetのsha256>`

周の観測（`$` は書かない。`need_rerun` に足さない）:

`node scripts/cycle-record.mjs --type token_ledger --cycle C-NNNN --seat grok --effort medium --packet-bytes N --tasks N --zero-value-reinject false`

## 集計

`node scripts/cycle-metrics.mjs --cycle C-0001`

`should_file_feature=true` なら reflector が Feature を proposed で起票する（直接 skill を書き換えない）。
token_ledger は観測項だけ。3指標と再起条件は変えない。

## 再起

人間が PR をマージしたあと `cycle-after-merge` が次票を起票する。
省略/失敗が無い、未マージの `cycle/*` PR がある、続きの Feature が残っている、
または `gh` で確認できないときは止める。`human_approved` は CLI から書かない。
