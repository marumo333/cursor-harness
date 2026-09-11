# Uber code-mode Implementation Plan

> **For agentic workers:** 親が単独実装。parallel-dispatch しない。

**Goal:** 2 本以上の照会 bash を `code-mode` CLI 1 回にまとめ、要約だけ返し、生の `&&` 連鎖は hook で deny する。

**Architecture:** 判定は `scripts/lib/code-mode.mjs`。実行は `scripts/code-mode.mjs`。Cursor `beforeShellExecution` は薄いラッパ。席は触らない。

**Tech Stack:** Node.js 22、`node:test`、既存 hook JSON。

## Global Constraints

- 新票 F-0010 は proposed。適用は F-0001。
- `--no-verify` 禁止。commit 主語は日本語 conventional。
- hooks から Task を起動しない。
- 0044 決定本文は消さない。

```yaml
plan_confirm:
  status: skipped
  c_trigger: true
  note: 親の単独実装。並列展開なし。
tdd_exceptions: []
```

## タスク

- [x] 失敗する code-mode / guard テストを先に書く
- [x] CLI と lib を最小実装
- [x] hook と skill と ADR / Feature
- [x] package.json と CI にテストを列挙
- [ ] feature-gate / pnpm test
- [ ] モード2 trio
- [ ] C-0009
