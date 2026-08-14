# knowledge/features/ — 自己改善・ハーネス変更の正本

作業項目の**正本**はここ（[[0038]]）。`learnings.md` は日記、ADR/criteria/skills/Rego は適用先。

## 起票

1. 次番号を決める（既存 `F-NNNN` の最大+1）。
2. `F-NNNN-kebab-slug.yaml` を追加する。トップレベルは必ず `feature:`。
3. `status: proposed` で起票。敵対レビュー後に `evidence.adversarial_review: approved`。
4. `node scripts/feature-gate.mjs --admit knowledge/features/F-NNNN-….yaml` が allow なら
   `status: admitted`。
5. `harness-grow` は admitted/in_progress の票だけ適用する。適用後 `done`。

kind:

| kind          | 意味                                      | 適用先                         |
| ------------- | ----------------------------------------- | ------------------------------ |
| harness-grow  | 手順・判断の昇格                          | skill / CLAUDE / ADR / criteria |
| harness-rule  | 学習した不変条件を決定的ルールにする      | `policy/learned/*.rego`        |
| product       | 製品挙動（この切り出しリポでは稀）        | 製品コード                     |
| chore         | canon をmutateしない雑務                  | ドキュメント等                 |

GitHub Issue は鏡にできるが、正本ではない（[[0033]]）。
