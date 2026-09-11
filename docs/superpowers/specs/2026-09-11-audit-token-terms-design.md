# 監査と token効率化の用語（工場比喻の撤回）

日付: 2026-09-11
対象: README アーキテクチャ節 / `scripts/license-readme.test.mjs` / F-0011

## 意図

工場比喻（工場長・治具・抜き取り・出荷など）は日本語として不自然で、席・正本・ゲート・cycle の正本語彙とずれる。人間指示どおり置き換える。

## 対応

| 旧 | 新 |
| --- | --- |
| 治具 code-mode | token効率化 |
| 工場長 | 監査 |
| ソフトウェア工場 | 監査（見出し）。導入文は席・正本・ゲート・cycle |
| 工場フロア | 実行 |
| 治具（packet / code-mode） | token効率化は code-mode と packet |
| 原料 | 入力 |
| 工程カード packet | packet |
| 抜き取り | 敵対レビュー |
| 検査 | 検証 |
| 振り返り | 内省 |
| 出荷 | 公開 |
| 正本倉庫 | 正本 |

mermaid のノード ID（`plant` / `warehouse` / `ship`）と cycle 辺は変えない。権限モデルの禁止辺も変えない。

## 非対象

- `docs/superpowers/specs/2026-09-04-token-efficiency-design.md` の「Uber 工場」（棄却した他社概念の固有名）
- F-0011 のファイル名（出生票のパスは動かさない）
- F-0011 は proposed のまま。適用は F-0001。入場しない

## 完了

README 本文と第1 mermaid に旧工場語が無く、`token効率化` と `監査` がある。テストがそれを固定する。
