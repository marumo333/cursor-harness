# ADR 0042: pre-commit は常時起動、コミット主語は日本語 conventional

- 状態: 受理
- 日付: 2026-08-15
- 背景: Claude の PreToolUse だけだと、Cursor の Shell や `--no-verify` で
  feature-gate を迂回できる。コミット主語が英語だと、人が読む文面の規約とずれる。
- 決定:
  1. **三重で必ず通す。** `scripts/githooks/`（`core.hooksPath`）+ Cursor
     `beforeShellExecution` + Claude `PreToolUse(Bash)`。いずれも同じ判定を使う。
  2. **hook 回避は拒否。** `--no-verify` / `-n` / `core.hooksPath=/dev/null` を禁止する。
  3. **主語は conventional prefix + 日本語。**
     `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `perf` /
     `ci` / `build` / `revert`。機械キー・パスは英語のまま可。英語だけの主語は拒否。
     git 生成の `Merge` は親が2つ以上のときだけ例外。手書き `Merge …` は拒否。
     `Revert "…"` は引用内の主語を再検査する。`fixup!` / `squash!` は rebase 中だけ。
     連鎖コマンド（`&&` / `;`）と `--no-veri` 略記、`GIT_CONFIG_*` / `git config core.hooksPath` /
     `chmod … githooks` / `scripts/githooks` 以外の hooksPath は拒否。
     CI は先端1件だけ検査する（`git log -1`。`--no-merges` は使わない。
     merge を飛ばすと祖先のレガシー主語や英語 merge 主語を見誤る。
     `git log HEAD` は全履歴になるので使わない。revision は `--` の前）。
     主語は `%B` の1行目（`%s` の段落折り畳みは使わない）。
     pull_request では Actions の merge commit ではなく
     `github.event.pull_request.head.sha` を `--tip` に渡す。
     範囲 `origin/main..HEAD` は 0042 以前の英語主語を含むので使わない（履歴は書き換えない）。
     先端検査では日本語レガシー免除を使わない。範囲指定のときだけ日本語レガシー主語を許容する。
     `git log` に任意 argv は渡さない。
     main に検査スクリプトがあるときは CI は main の copy を使う（PR 側でゲートを緩めない）。
  4. **pre-commit 本体**は staged `.env` 禁止 + `node scripts/feature-gate.mjs`。
     hooks から Task は起動しない（[[0033]]）。
  5. clone 後は `node scripts/install-git-hooks.mjs`（`pnpm` の `prepare` でも同じ）。
- 結果: 実装後の commit がゲートを飛ばせない。トークン節約の本体は席への再注入削減（[[0033]]）であり、
  この hook 自体は入力トークンを減らさない。
- 関連: [[0016]] [[0033]] [[0038]]
