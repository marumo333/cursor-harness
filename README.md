# cursor-harness

プロダクトを含まない Cursor ハーネスの**テンプレート**。製品を作る前にここから切る（[[0039]]）。

## 何をするか

- 席: 親 Grok 4.6 / Opus ゲート / Sol は3体多数決のみ
- 正本: `knowledge/features/F-NNNN-*.yaml`
- 入場: OPA `node scripts/feature-gate.mjs`
- 管理: skill の使用/省略を `knowledge/graph/` に書き、ノード / 辺 / 状態の3指標で計る
- 再起: 人間が PR をマージしたあと、省略が残っていれば次 Feature の下書き PR を開く（エージェントは自動起動しない）
- パッケージ: pnpm（[[0041]]）

使い方は `TEMPLATE.md`。

## 設計概要

```mermaid
flowchart LR
  parent["親 Grok 4.6"]
  opus["Opus 5 ゲート"]
  trio["高リスク trio"]
  parent -->|"壁打ち / 統合 / cycle"| opus
  opus -->|"plan-confirm / レビュー / verify / reflect"| parent
  parent --> trio
  trio --> o2["Opus 5"]
  trio --> g2["Grok 4.6"]
  trio --> sol["GPT-5.6 Sol"]
```

```mermaid
flowchart TD
  clone["clone テンプレート"] --> adr["ADR で技術選定"]
  adr --> feat["Feature を proposed 起票"]
  feat --> gate["feature-gate 入場"]
  gate --> impl["実装"]
  impl --> review["敵対レビュー"]
  review --> verify["verify"]
  verify --> reflect["reflect"]
  reflect --> pr["人間が PR マージ"]
  pr --> cycle{"省略 / 失敗?"}
  cycle -->|yes| feat
  cycle -->|no| stop["止める"]
```

## 構成

```
.claude/          エージェント / skill / hook
.cursor/          Cursor の hook
knowledge/        ADR / 判断基準 / Feature / グラフ / 内省
policy/           OPA（入場と cycle）
scripts/          feature-gate / cycle-*
```

## 置かないもの

認証・課金・UI・DB・e2e・配信・案件グラフ。それらは製品リポに足す。
