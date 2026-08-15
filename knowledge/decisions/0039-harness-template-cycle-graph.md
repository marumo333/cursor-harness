# ADR 0039: 製品排除テンプレートと有界サイクルグラフ

- 状態: 受理
- 日付: 2026-08-14
- 背景: 本リポはプロダクトを作る前に切るハーネス テンプレートにする。製品 agent/skill/hook が残ると
  移植先が marumo333 前提になる。一方で自己改善は「人間がチャットを開く1周」しか無く、
  skill 省略も複製/送信後の再起も無い。無制限の自動再起は無制限再起防止（[[0033]]）と衝突する。
- 決定:
  1. **製品ゼロ。** 認証/課金/UI/DB/e2e/HOTL/配信の agent・skill・hook・criteria を置かない。
     席は親 Grok + Opus ゲート（plan-confirm / 敵対レビュー / verifier / reflector）+ Sol は3体のみ。
  2. **グラフはハーネス改善専用。** ノード=skill/feature/cycle、辺=受け渡し/承認、状態=used|skipped|failed|approved。
     正本イベントは `knowledge/graph/events.jsonl`。案件×お金グラフは置かない（[[0031]] 製品頭脳分離）。
  3. **3指標。** node_skip_rate / edge_skip_rate / state_integrity。閾値超過で Feature を proposed 起票。
  4. **再起は有界。** hooks から Task は起動しない（[[0033]]）。人間が PR をマージしたあとだけ
     `cycle-after-merge` が次サイクル用の下書き PR（鏡）を開く。
     省略/失敗が無い周、未マージの cycle PR、未処理の cycle-followup Feature、
     または MERGED≠true なら開かない。空サイクルの integrity=0 だけでは再起しない。
     キー欠落は deny。`human_approved` は after-merge だけが書く。
  5. **複製先の正本**は複製先の `knowledge/features/`。GitHub PR は鏡。テンプレートの使い方は `TEMPLATE.md`。
  6. **製品を始める順。** clone → ADR で技術選定（テンプレート ADR を型に更新）→ Feature を proposed 起票
     → 入場のあと実装。実装から入らない。
- 結果: 空リポに複製/送信して人間がマージすると、省略が残っている限り次票が起票される。
  エージェント実行そのものは人間または Cloud Agent 起動が必要（Task 自動点火はしない）。
- 関連: [[0033-harness-api-budget-routing]] [[0038-feature-canon-opa-grow]] [[0016-definition-of-done]]
