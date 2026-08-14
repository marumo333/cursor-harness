# ADR 0039: 製品排除テンプレートと有界サイクルグラフ

- Status: Accepted
- Date: 2026-08-14
- Context: 本リポはプロダクトを作る前に切るハーネス template にする。製品 agent/skill/hook が残ると
  移植先が marumo333 前提になる。一方で自己改善は「人間がチャットを開く1周」しか無く、
  skill skip も clone/push 後の再起も無い。無制限の自動再起は observer-loop 防止（[[0033]]）と衝突する。
- Decision:
  1. **製品ゼロ。** 認証/課金/UI/DB/e2e/HOTL/配信の agent・skill・hook・criteria を置かない。
     席は親 Grok + Opus ゲート（plan-confirm / 敵対レビュー / verifier / reflector）+ Sol は trio のみ。
  2. **グラフはハーネス改善専用。** ノード=skill/feature/cycle、辺=handoff/approval、状態=used|skipped|failed|approved。
     正本イベントは `knowledge/graph/events.jsonl`。案件×お金グラフは置かない（[[0031]] 製品頭脳分離）。
  3. **3指標。** node_skip_rate / edge_skip_rate / state_integrity。閾値超過で Feature を proposed 起票。
  4. **再起は有界。** hooks から Task は起動しない（[[0033]]）。人間が PR をマージしたあとだけ
     `cycle-after-merge` が次サイクル用の draft PR（鏡）を開く。metrics 緑なら開かない
     （未処理 Feature は既にある票で進める。cycle PR を量産しない）。
     未マージの cycle PR が既にあれば開かない。キー欠落は deny。
  5. **clone 先の正本**は clone 先の `knowledge/features/`。GitHub PR は鏡。template の使い方は `TEMPLATE.md`。
- Consequences: 空リポに clone/push して人間がマージすると、skip が残っている限り次票が起票される。
  エージェント実行そのものは人間または Cloud Agent 起動が必要（Task 自動点火はしない）。
- Links: [[0033-harness-api-budget-routing]] [[0038-feature-canon-opa-grow]] [[0016-definition-of-done]]
