# AGENTS.md

このリポジトリは **プロダクトを含まない Cursor ハーネス**（ガバナンス基盤）。製品コード（認証/課金/UI/DB/e2e/配信）は置かない。運用規約の正本は [`.claude/CLAUDE.md`](.claude/CLAUDE.md) と [`.claude/AGENTS.md`](.claude/AGENTS.md)、手順は [`TEMPLATE.md`](TEMPLATE.md)。

## Cursor Cloud specific instructions

このセクションは、update script 実行後のクラウド環境で起動する将来のエージェント向けの、非自明な起動・実行の注意点をまとめる。標準手順は既存ドキュメント（README / package.json / TEMPLATE.md）を参照。

### 何のリポか

Node.js 製のガバナンスハーネス。npm 依存パッケージは無い（`package.json` に `dependencies` なし）。「アプリ」= `scripts/` の Node スクリプト群 + OPA によるポリシーゲート。

### 実行環境

- Node.js 22 系 + pnpm 10.33.3（corepack 経由）。追加の言語ランタイムは不要。
- ゲート（feature-gate / OPA）は **Linux amd64 専用**。`scripts/ensure-opa.mjs` が OPA v1.8.0 を `.tools/opa` に digest 検証付きで取得する（`.tools/` は gitignore）。macOS / Windows / Linux arm64 では動かない。
- OPA バイナリの取得には GitHub Releases への外向き通信が必要。初回の `node scripts/feature-gate.mjs` 実行時に遅延ダウンロードされる。

### コマンド（lint / test / build / run に相当）

- 依存導入 + git hooks 設定: `pnpm install`（`prepare` が `core.hooksPath=scripts/githooks` を設定）。
- 自動テスト: `pnpm test`（`node --test`、58 件）。
- ポリシー lint / test（OPA のみ）: `node scripts/feature-gate.mjs --test`。
- 正本ゲート本体（build/run 相当）: `node scripts/feature-gate.mjs`。canon パス（`scripts/` `policy/` `.claude/skills/` `knowledge/features/` など、正本は `policy/canon.rego`）を変更する場合は Feature 起票 + OPA allow が必要。

### 非自明な落とし穴

- Cursor の `beforeShellExecution` ガード（`.cursor/hooks/pre-commit.mjs` → `scripts/lib/commit-guard.mjs`）は、**シェルコマンド文字列に `git config ... hooksPath` が含まれるだけで（読み取り目的でも）拒否する**。hooksPath を確認したいときは `.git/config` を読む（例: `grep hooksPath .git/config`）。同様に `git commit --no-verify` / `-n` も拒否される。
- コミットメッセージは conventional prefix + 日本語主語が必須（`feat:` / `fix:` / `docs:` / `chore:` など）。英語のみの主語や prefix 無しは commit-msg hook に落とされる。`--no-verify` は禁止。
- ルートの `AGENTS.md` は canon ではない（canon は `.claude/AGENTS.md`）。ここの編集はゲートで Feature を要求しない。
