# テンプレートの使い方

このリポジトリは Cursor ハーネスのテンプレートです。対象は席・正本・ゲート・cycle（[[0039]]）。

## 空リポへ載せる

```bash
git clone https://github.com/marumo333/cursor-harness.git
cd cursor-harness
corepack enable
# リモートを新しい空リポに向ける
git remote set-url origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

人間が GitHub で初期コミットを確認する。以降の改善は feature ブランチ → PR → マージ。

## ハーネスを始める（clone のあと）

実装から入らない。技術選定を ADR に書いてから Feature を起票する（[[0038]] / [[0039]]）。

1. このテンプレートを clone（または空リポへ載せる）。
2. `knowledge/decisions/` に **技術選定 ADR** を起票する（席 / 正本 / ゲート / 実行基盤）。
   テンプレートの既存 ADR を正本の型として使い、複製先の決定で更新する。
3. その ADR を指す `knowledge/features/F-NNNN-*.yaml` を **proposed** で起票する。
   同一 PR で `admitted` / `approved` にしない（出生規則）。
4. 起票 PR を人間がマージしたあと、次の PR で実装する。
   apply は merge-base に **ファイルが存在する** Feature だけが被覆できる（票の中身は作業ツリーを読む）。
   次 PR の先頭で status を `admitted` にし、レビュー承認のあと `node scripts/feature-gate.mjs --admit` を通す。
   同一 PR で生まれた票を `admitted` / `approved` にはしない。
5. 席は親 Grok 4.6 / Opus ゲート / Sol は3体のみ。必須 skill は `cycle` に記録する。
6. `node scripts/install-git-hooks.mjs`（または `pnpm install` の prepare）で
   `core.hooksPath=scripts/githooks` を入れる。commit 主語は `feat:` / `docs:` 等 + 日本語。
   `--no-verify` は拒否される（[[0042]]）。

GitHub Issue / Spec Kit は正本にしない（[[0033]]）。

## 1周（ハーネス改善も同じ）

1. 親は Grok 4.6。ゲートは Opus Task（計画確定 / 敵対レビュー / 検証 / 内省）。
2. 必須 skill を使ったら `cycle` skill でノードと辺を記録する。
3. 再現可能な改善は `knowledge/features/F-NNNN-*.yaml` に起票する。
4. canon 変更は `node scripts/feature-gate.mjs` が入場する。
5. PR を人間がマージすると、省略が残っていれば次 Feature の下書き PR が開く（エージェントは自動起動しない）。
