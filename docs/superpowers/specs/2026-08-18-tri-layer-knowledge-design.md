# 三層知識（TLK）— 2026-08-18

AI が読む層 / 中間の索引層 / 人間が読む層を型づけし、複数エージェント接続のトークンを減らす。
ベクトル（764/768 次元）は v1 の正本にしない。

## 問い

複数エージェントが `knowledge/` と ADR を grep・全文読込すると、実装が遅くトークンが膨らむ。
意思決定ログは残したまま、着手時は短い機械層だけを読んでレビュー判断を速くしたい。

## 調査結論（OSS / 記事）

完全一致する規格は無い。**3聴衆層 + 764次元 vector ontology は NO。**

| 近い先行 | 層の意味 | 借りる点 | 足りない点 |
| --- | --- | --- | --- |
| [llms.txt](https://llmstxt.org/) | 小さい地図 → リンク先だけ読む | 索引を先に読む | 型もゲートも無い |
| [AGENTS.md](https://agents.md/) vs README | 人間 / エージェントの2聴衆 | ファイル分離 | 中間層無し。常時全文投入されがち |
| [Agent Skills](https://agentskills.io/specification) | metadata → 本体 → 参照の遅延読込 | 段階読込 | 聴衆3層ではない。全部 AI 向け |
| [Aider repo map](https://aider.chat/docs/repomap.html) | 記号地図 1k tok | 中間層の完成形 | オントロジー型ではない |
| Graphiti / Cognee / OG-RAG | 型付きグラフ + 埋め込み | 検索は近似、決定は記号 | リポ正本の3層規格ではない |
| Gatekeeper / Conftest / Backstage | YAML 実体 + Schema 形 + Rego 政策 + MD 説明 | このハーネスと同じ三段 | 聴衆層の名前が無い |
| LinkML / Pydantic | YAML スキーマから多表現を生成 | 「ランタイムモデル ≠ 正本」 | Python 依存。このリポは Node ゼロ依存 |

764 次元は公式モデルカードに無い。BERT/E5 を 764 と書いた論文は公式 768 の誤記。
768 は実在する（E5-base / Nomic / BGE-base / OnT-MPNet）。
類似度を入場や approve に使うと [[0018]] / OWASP LLM08 と衝突する。

knowledge は現状 **32 ファイル**。ID（`F-NNNN` / `[[NNNN]]`）と YAML がある。
この規模ではベクトル層の固定費（モデル/API・鮮度・誤检索の再注入）が、目次+grep より高くなりやすい。

## 方針（3案）

### A. カタログ先行（推奨）

`machine` / `index` / `human` を型として固定する。
着手時は `knowledge/index/catalog.json`（短い要約+ポインタ）だけ読む。
決定は従来どおり OPA。ベクトルは置かない（後年の任意 recall）。

- 利点: ゼロ依存を守る。[[0033]] の packet（再注入削減）と一致。出生規則を壊さない。
- 欠点: 言い換え検索は弱い。ID とパスが分かる問いに最適化。

### B. ベクトル先行

knowledge を 768 次元に埋め込み、grep の代わりに類似度で読む。

- 利点: ID を知らない言い換えに強い（大規模・非構造のとき）。
- 欠点: 依存・秘密送信・鮮度ずれ・決定の非決定性。この規模ではトークンが増えうる。
  764 を「専用次元」にする一次資料は無い。

### C. 既存規約の寄せ集めだけ

llms.txt + AGENTS.md + Skills 遅延読込だけ採用し、新概念を作らない。

- 利点: すぐ書ける。
- 欠点: 型が無い。層の意味がファイル慣習に散る。次周がまた全文を読む。

**採用: A。** B の埋め込みは索引が数百チャンクを超えてから、recall 専用・gitignore・OPA 入力禁止、として別 Feature にする。

## 新概念: 三層知識（TLK）

このリポの語彙で聴衆と正本性を分ける。学術用語の引用にはしない。

| 層 | 英語キー | 聴衆 | 形 | 正本か | 既存物 |
| --- | --- | --- | --- | --- | --- |
| 機械層 | `machine` | エージェント / ゲート | YAML/JSON。欠落で拒否できるキー | 正本 | Feature 票、criteria、`required-cycle.json` |
| 索引層 | `index` | 両方（短い） | カタログ。id / path / rel / 1行要約 | 派生。決定しない | 新設 `knowledge/index/` |
| 人間層 | `human` | 人間 | Markdown 散文 | 説明。正本にしない（[[0038]]） | ADR、learnings、SKILL 本文 |

読込順: **index → 必要な machine → 必要な human**。
learnings 全文と decisions 全件を1周で再読しない（[[0033]]）。

Pydantic は導入しない。JSON Schema は入場正本にしない。
インスタンス正本は YAML/JSON、形と政策の正本は Rego（現行）。
Schema 文書はエディタと人間向けの横ファイル。

### 型の骨格

```yaml
# 機械層の核（既存 Feature と揃える。ゲートは原文を読む）
id: string
kind: enum          # feature | criterion | cycle-required | harness-rule
status: enum
layer: machine
path: string
mutates_canon: boolean   # Feature のみ
refs: [string]           # 索引への出口。散文禁止
```

```yaml
# 索引層の核（1エントリ。advisory。ゲートは読まない）
id: string              # kind ごとの導出。本文の生 id: を掻かない
kind: enum              # decision | feature | criterion | skill | cycle
layer: enum             # machine | index | human
path: string
status: string          # feature/decision のみ実値。他は n/a
summary: string         # 1行・80字。形だけ検証。命令文では落とさない
rels:
  - rel: cites | requires
    target: string      # ADR-NNNN または skill:<name>
```

```yaml
# 人間層の核（v1 は検証しない）
# 実 ADR は「# ADR NNNN:」+「- 背景:」箇条書き。## 見出しではない。
title: string
status: enum            # 提案 | 受理 | 廃止
```

id 導出（衝突防止）:

| kind | id | 本文の `id:` |
| --- | --- | --- |
| feature | OPA の `feature.id` | 使ってよい（Feature 封筒。feature-gate と同じ） |
| decision | ファイル名 `ADR-NNNN` | 見ない |
| criterion | `criterion:<stem>` | **見ない**（grow-admission の `id: F-0001` は bootstrap 記述） |
| skill | `skill:<frontmatter name>` | 見ない |
| cycle | `cycle:required` のみ。ノードは `rels.requires` | 見ない |

ベクトルフィールドはスキーマに載せない（Semantic Kernel 旧 MemoryRecord の失敗: 埋め込みを固定すると永続が壊れる）。

## データ流

```
正本 machine (Feature/criteria/cycle JSON)
  + human (ADR/learnings/skills)
        ↓ 決定的に生成
index catalog.json + llms.txt
        ↓ エージェント着手
必要な id だけ Read
        ↓
決定: feature-gate / OPA（類似度は input に入れない）
```

## 非目標（v1）

- 埋め込みモデル、Vector DB、Pydantic、Ajv、Zod、LinkML ランタイム、RDF
- 類似度による admit / approve
- `knowledge/index/` を canon にする（events.jsonl と同じ派生。入場後の別票）
- GitHub Issue / Spec Kit を正本にする（[[0033]]）

## 完了の定義（この票）

1. ADR 0043 が不変条件を書く: 索引は派生で決定に使わない / 類似度は OPA に入れない / `--check` / 入場は原文。
2. F-0006 が `proposed` + `adversarial_review: pending`（同一 PR で admitted / approved にしない）。
3. catalog を生成でき、id 一意・summary 制約・Feature の OPA 突合・`--check` が通る。
4. `.claude/AGENTS.md` が「地図は index。入場は原文」と書く（全文再読の抑制は learnings/decisions 全件に限る）。
5. `pnpm test` と `node scripts/feature-gate.mjs` が緑。被覆は F-0001 の通常被覆（bootstrap 免除ではない）。
6. CI が新テストと `--check` を実行する。
7. learnings 追記と cycle 記録（[[0016]]）。

## リスク

- カタログが古いと間違ったパスを開く → 決定的生成 + CI `--check`。
- 要約を命令として読む → データ扱い（[[0018]]）。形（1行・URL/フェンス）だけ機械検証する。命令文フィルタは置かない。
- 索引を canon にすると生成物がゲートを自己参照する → v1 は canon 外。ゲートは catalog を読まない。
- criteria 本文の `id: F-0001` を掻くと Feature と衝突する → criterion はファイル名だけ。
