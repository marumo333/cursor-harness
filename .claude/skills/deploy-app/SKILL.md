---
name: deploy-app
description: marumo333 のアプリ(SvelteKit)を Cloudflare Pages/Workers に配信する。※頭脳モデルの serve は別(merge/deploy)。
---

# deploy-app skill（アプリ配信・Cloudflare）

> 頭脳モデルの vLLM serve は **これではない**。それは `jp-code-merge/deploy`（BOUNDARY 契約①）。ここはアプリのみ。
> 手順は親 Grok。配信障害の診断は Opus Task（[[0033]] / [[0037]]）。

## 手順

1. ビルド: `npm run build`（`adapter-cloudflare`）。
2. secret 設定: `wrangler secret put`（`SUPABASE_SERVICE_ROLE_KEY`/`OPENAI_API_KEY`/`STRIPE_SECRET_KEY` 等）。
   ※`PUBLIC_` 以外はここ。クライアントに出さない（規約1）。
3. 配信: `wrangler pages deploy`（or Workers）。
4. **機微API(`/api/chat`等)は Cloudflare 非プロキシ/DNS-only**（主権モード時・規約3）。

## 確認

本番URLで認証→チャットが通ること。`OPENAI_BASE_URL` は merge/deploy の `endpoint.env` を指す。
