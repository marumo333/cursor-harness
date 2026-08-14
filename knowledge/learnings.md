# learnings.md — 自己成長ループの記憶（実行ごとに追記）

各タスク完了時に「効いた / 失敗した / edge case」を追記する。
再現可能な改善は Feature 正本（`knowledge/features/`）に起票し、OPA 入場後に昇格する（[[0038]]）。
製品日記は置かない（[[0039]]）。

---

## 2026-08-14 — 製品排除テンプレートと有界サイクル（ADR 0039 / F-0002）

**問い**

- プロダクトを作る前に切る template に、製品 agent/skill が残っていた。
- 自己改善は1周の手順だけで、skill skip の3指標も merge 後の再起も無かった。

**worked**

- 製品 agent/skill/hook/criteria（auth/課金/UI/DB/e2e/HOTL/配信）を削除した。
- 必須ノードの used/skipped を `knowledge/graph/events.jsonl` に書き、node/edge/state を出す。
- 再起は人間の PR マージ後だけ。hooks から Task は起動しない。metrics 緑なら止める。
- `events.jsonl` は canon 外（追記ログ）。必須集合は `required-cycle.json` だけ。
- cycle.rego はキー欠落を deny。`gh pr list` 失敗は open 扱い（fail-closed）。
- 再起は skip/fail がある周だけ。空サイクルの integrity=0 では量産しない。
- feature-gate は PR ツリーの `*.test.mjs` を実行しない（信頼ゲート内 RCE 回避）。
- `cycle-record` は node/state を検証し、`human_approved` は after-merge 専用。
- `cycle.admission.deny` が配列でなければ exit 1。壊れた events.jsonl は書き換えない。

**failed / リスク**

- Actions が Feature YAML を書く。`proposed` + `mutates_canon: false` に閉じ、エージェントは起動しない。
- `adversarial_review: approved` は依然自己申告（F-0001 既知限界の続き）。
- PR #1 が main に入った時点で F-0001 bootstrap は切れた。`bootstrap: true` のままでは
  以降の apply が全 deny になる。導入後は `bootstrap: false` にする。
- F-0002 は同一 PR で admitted にできない（出生規則）。今回の canon 適用は
  merge-base 上の F-0001（in_progress + review approved）で被覆する。

**next**

- 必須 skill をこの周で記録し、緑なら merge 後に再起しないことを確認する。

---

## 2026-08-14 — Feature 正本 + OPA grow 入場（ADR 0038 / F-0001）

**問い**

- 自己改善は learnings 日記 + skill 直接書き換えで、作業正本が無かった。

**worked**

- 正本を `knowledge/features/F-NNNN-*.yaml` に置いた。GitHub Issue は正本にしない。
- reflector = 起票、grow = OPA allow の票だけ適用。F-0001 bootstrap は human + 1回限り。
- deny 空だけを見る。キー欠落は helper 完全ルール。`mutates` は diff 導出。

**failed / リスク（敵対レビューで CONFIRMED → 修正済み）**

- `not (x in set)` の hoisting、bootstrap 恒久化、新規 Feature の自己承認、OPA_BIN 回避。

**既知の限界**

- `adversarial_review: approved` とレビュー成果物ハッシュの突合は未実装。
