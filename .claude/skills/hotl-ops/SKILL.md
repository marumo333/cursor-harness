---
name: hotl-ops
description: 実機 e2e・デバッグ・運用保守・UX探索の HOTL レーン（枠は今・手順は実績から）。頭（orchestrator）が実行する。
---

# hotl-ops skill（[[0032-ops-subagent-hotl]]）

**実行主体**: 親チャット（Grok / orchestrator）直轄で手順を回す。診断・根因分析は Task(Opus 5)。
`ops-runner` agent は置かない（承認対話が本体のため・[[0032]] / [[0033]]）。

## 事前承認パッケージ（全ドメイン共通入口・HITL）

実環境の読み取りにも鍵が要り、agent は `deny: Read(.env)` で自力で触れない。セッション冒頭で人間が提供:

- `.env` 実値の提供方法（パイプ渡し・値をチャットに出さない）
- CLI 認証（`supabase link` / `wrangler` / `modal` 等、触る対象に応じて）
- 予算・スコープ・期限（クレジット／GPU／変更してよい namespace）
- ネットワーク権限（Cursor sandbox 承認カード）

## 操作の三分類（credential 提供後）

1. **読み取り専用診断**: credential 提供後に限り auto（提供自体は HITL）。
2. **可逆な状態変更**: 予算＋スコープ＋期限内は自走。**記録先**: `knowledge/learnings.md`（ops 専用ログは作らない）。
3. **不可逆**: 本番データ削除・外部送信・secret ローテーション・予算超過 → 常に HITL。即停止して差し戻し。

## ドメイン

### 1. 実機 e2e（手順あり — learnings 実績）

専用テストユーザー namespace。癖: Modal cold start 約2.5分・303 リダイレクト・鍵パイプ渡し・signup の example.com 拒否。

### 2. 実機デバッグ（レーン定義のみ）

三分類適用・入口＝事前承認。**実環境への直接ホットフィックス禁止** — 修正は実装→敵対レビュー→verify に戻す。
手順本体は初実戦→learnings→本 skill 昇格（創作しない）。参照: superpowers `systematic-debugging`。

### 3. 運用保守（手順あり — learnings 2026-07-13 昇格）

同上の三分類・HITL 入口。jp-code-merge 境界維持（規約5）。

#### 実 DB migration 適用（0006 等・`db-migrate` skill 併用）

**事前承認パッケージ（HITL 必須）**:

- `.env` 実値のパイプ渡し（チャットに値を出さない）
- `supabase link --project-ref <ref>`（Tokyo プロジェクト）
- スコープ = migration 適用のみ（データ削除・secret ローテーション禁止）
- 期限（例: 1セッション）

**手順（golden path）**:

1. ローカルで `supabase db reset` → `npm run test:e2e` 緑を確認済みであること（CI も緑）。
2. 適用前: hosted で権限ダンプ（`\dp credit_ledger` 等の同等 SQL）を取得し記録。
3. `supabase db push`（対話は事前承認済みの前提）。
4. 適用後: `supabase migration list` で Local=Remote を確認。
5. 適用後: 権限ダンプを再取得し差分を `learnings.md` に記録（hosted は広い default で no-op になり得る）。
6. 実機確認: service_role で `credit_ledger` INSERT が通ること・authenticated の台帳書込が拒否されること。

**0006 実 DB 適用の状態**: 2026-07-13 適用済み（`marumo333-dev` / ap-northeast-1）。

#### wrangler pages dev smoke（workerd 差の実測）

vite dev e2e では workerd 差をカバー不能。hermetic 構成で初回実戦済み（2026-07-13）。

```bash
npm run smoke:wrangler
```

- 鍵: `scripts/wrangler-pages-dev.mjs` が `supabase status -o json` → `--binding` 注入（`.env` 不要）。
- wrangler は devDependency `4.107.0` にピン。`nodejs_compat` 必須。
- 確認: login → chat NDJSON done（`e2e/wrangler-smoke.spec.ts`）。**CI には入れない**（必須ゲート化しない）。
- 初回実測: workerd でも vite dev と同条件で NDJSON 完了 UI まで通過（差なし）。`nodejs_compat` 未設定時は async_hooks 警告。

### 4. UX 探索監査（マイルストーン時・必須ゲートにしない）

`responsiveness-check` / `design-review` / `ux-audit`。browser は単一インスタンスのため直列。

### 5. インシデント

監視レーンは**存在しない**。**検知は人間起点**。agent は人間が持ち込んだ症状から診断を開始する。
