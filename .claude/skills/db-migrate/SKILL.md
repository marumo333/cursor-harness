---
name: db-migrate
description: Supabase の migration を作成・適用し RLS を確認する。テーブル追加/変更時に使う（db-migrator agent 用）。
---

# db-migrate skill

手順・ローカル適用は親 Grok / `db-migrator`(Grok)。実 DB は HOTL。スキーマ設計・RLS 方針の判断は
C トリガとして `backend-architect`(Opus 5) 必須（[[0034]] / [[0037]]）。

## 手順

1. `supabase/migrations/<timestamp>_<name>.sql` を作成（テーブル＋**全テーブル RLS**・規約2）。
2. **ローカル適用**: `supabase db reset`（or `supabase migration up`）。RLS 検証: 別ユーザーで他テナント行に到達不能か。
3. **実 DB 適用**（Tokyo 等・learnings 2026-07-12 golden path）:
   - 事前: HOTL 事前承認パッケージ（`.env` / CLI 認証 / スコープ）。値をチャットに出さない。
   - 鍵は `supabase projects api-keys -o json` 等を**消費コマンドへ直接パイプ**（ファイル化・表示は hook がブロック）。
   - `supabase link`（要時）→ `supabase db push`。
   - 適用後: `supabase migration list` で Local=Remote を確認。必要なら RLS 実機確認。
4. 型再生成（使う場合）: `supabase gen types typescript`。

## 規律

- `credit_ledger`/`usage`/`subscriptions`/`message_feedback` は SELECT のみ本人可、書込 service_role のみ。
- スキーマは `DESIGN.md §5` と ADR 0008/0019 準拠。
- 実 DB への破壊的変更・本番データ削除は HOTL hard-gate（[[0032]] / `hotl-ops`）。
