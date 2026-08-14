# cursor-harness

プロダクトを含まない Cursor ハーネス **template**。製品を作る前にここから切る（[[0039]]）。

## 何をするか

- 席: 親 Grok / Opus ゲート / Sol は trio のみ
- 正本: `knowledge/features/F-NNNN-*.yaml`
- 入場: OPA `node scripts/feature-gate.mjs`
- 管理: skill の used/skipped を `knowledge/graph/` に書き、node / edge / state の3指標で計る
- 再起: 人間が PR をマージしたあと、skip が残っていれば次 Feature の draft PR を開く（エージェントは自動起動しない）

使い方は `TEMPLATE.md`。

## 構成

```
.claude/          agents / skills / hooks
.cursor/          Cursor hooks
knowledge/        ADR / criteria / features / graph / learnings
policy/           OPA（入場 + cycle）
scripts/          feature-gate / cycle-*
```

## 置かないもの

認証・課金・UI・DB・e2e・配信・案件グラフ。それらは製品リポに足す。
