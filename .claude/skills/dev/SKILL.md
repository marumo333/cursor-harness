---
name: dev
description: marumo333(jp-code-agent) をローカル起動して動作確認する。UI/認証/チャットの変更を実機で見る時に使う。
---

# dev skill

親チャットは Grok 前提（[[0033]] / [[0037]]）。手順の実行は親または Grok Task。失敗の根因診断は Opus Task。

## 手順

1. 依存: `npm install`（初回）。
2. `.env` を用意（`.env.example` を複製し `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY`。M1 以降は
   `OPENAI_BASE_URL`/`MODEL_NAME`(既定`qwen36-27b`)/`OPENAI_API_KEY`）。
3. `npm run dev` → `http://localhost:5173`。
4. 型チェック: `npm run check`（コミット前は緑必須・規約6）。

## 確認観点（M0）

未認証 `/`→`/login` リダイレクト／signup→login→`/`／案件スコープのチャットが1文字ずつストリーム／logout→`/login`。

## Windows の落とし穴（golden path・2026-07-05）

- **`.env`/`.env.local` は BOM 無しで作る。** PowerShell 5.1 の `Out-File -Encoding utf8` は BOM を付け、
  先頭変数が読めず `$env/dynamic/public` が空 → `createServerClient('')` が全ルートで 500 になる。
  正: `[System.IO.File]::WriteAllText("$PWD\.env", "PUBLIC_SUPABASE_URL=...`nPUBLIC_SUPABASE_ANON_KEY=...`n")`
  または `Set-Content -Encoding ascii`。診断: `Format-Hex .env | Select -First 1` の先頭が `EF BB BF` なら BOM。
- `.env` 変更後は **dev 再起動**（起動時読み込み）。
