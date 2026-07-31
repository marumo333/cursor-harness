# ADR 0018: AI/エージェント・セキュリティ（OWASP LLM/Agentic Top 10）

- Status: Accepted（Amended by: [[0037-opus5-gate-routing]]）
- Date: 2026-07-04
- Context: 文書取り込み・ツール・マルチテナントのエージェントSaaSは**プロンプトインジェクション（特に間接注入）**が
  死活（PoisonedRAG は5件で成功率90%）。secret/RLS/sandbox だけでは不足。
- Decision: **defense-in-depth**（`criteria/security-policy.yaml` にデータ化）:
  1. **間接注入対策**: 取得文書/ツール出力/Web内容は**データ扱い（命令にしない・spotlighting/デリミタ）**。取得内容から自動アクション禁止。
  2. **最小権限＋テナント束縛**: 各ツールは**session由来 user_id で強制フィルタ**（プロンプト由来IDを信用しない）＋RLSバックストップ。
  3. **高リスク操作は human-in-the-loop**（削除/外部送信/閾値超クレジット消費/コード実行はUI確認）。
  4. **出力安全**: markdown/HTMLサニタイズ＋厳格CSP＋**リモート画像自動読込禁止**（exfilビーコン防止）、ツール呼び出し構造化検証。
  5. **消費上限**: プリペイド残高ゲート（[[0004-prepaid-billing]]）＋レート制限＋run毎step/token上限＋ループガード。
  6. **コード実行はサンドボックス隔離**（ネット遮断・資源制限・揮発）。**RAG既定off**（[[0007]]）でポイズニング面縮小。
  7. **供給網**: プラグイン/MCP は pin＋最小権限。機密はプロンプトに載せない（[[0014]]）。
  8. **検出**: 全ツール呼び出しを監査ログ。`security-reviewer`(Claude ゲート既定＝Opus 5・[[0037]]・高リスクは3ファミリー)＋レッドチームで敵対的テスト。
  9. **法務**: 個人データを US/EU ホストで処理する場合 GDPR十分性認定EUホスト or クラウド例外。完全国内は主権モード。
- Consequences: プロンプト/ツール/取得を制御する **agent 側の責務**（merge は「トークンを返すだけ」）。
- Links: [[0004-prepaid-billing]] [[0007-agent-first-retrieval]] [[0016-definition-of-done]]
  [[0037-opus5-gate-routing]]
