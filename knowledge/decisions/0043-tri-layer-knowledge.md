# ADR 0043: 三層知識（machine / index / human）

- 状態: 提案
- 日付: 2026-08-18
- 背景: 複数エージェントが knowledge と ADR を grep・全文読込するとトークンが膨らむ。
  AI 可読層と人間可読層を分け、764 次元の vector ontology で判断したいという案があった。
  調査の結果、3聴衆層+764次元の完成規格は無く、764 は 768 の誤記が多い。
  類似度を入場に使うと [[0018]] と衝突する。この規模では目次の方が安い。
- 決定:
  1. **三層知識（TLK）。** `machine`（型付き正本）/ `index`（短い地図）/ `human`（散文）。
  2. **索引は派生。** `knowledge/index/` は canon にしない。決定・入場・被覆に使わない。
  3. **埋め込みは使わない。** 類似度は v1 非採用。将来も OPA input と admit/approve に入れない。
  4. **生成は決定的。** `node scripts/knowledge-catalog.mjs --check` で鮮度を検査する。
     起動は CLI と CI のみ。hooks から生成しない。
  5. **入場は原文。** 運用規約から index を参照しても、判断は Feature / criteria / policy を読む。
  6. **id 空間。** kind 接頭辞で分割し全エントリ一意。cycle ノードは `rels.requires`。
     Pydantic は導入しない。形の正本は Rego。Schema 文書は横ファイル。
- 結果: 着手時は catalog を地図にし、必要な原文だけ読む。ベクトル層は別 Feature。
  導入中の CI 鮮度検査は PR 側 scripts を使う。main に載った次 PR で origin/main の scripts に切り替える。
- 関連: [[0016-definition-of-done]] [[0018-ai-security]] [[0033-harness-api-budget-routing]]
  [[0038-feature-canon-opa-grow]] [[0039-harness-template-cycle-graph]]
