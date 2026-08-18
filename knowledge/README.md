# knowledge/ — 意思決定ログと手続きメモリ

判断基準をデータとして保持し、自己成長ループが着手時に読み・内省時に書く場所。

```
decisions/    ADR（1ファイル1決定）— human
features/     自己改善の作業正本（F-NNNN YAML・[[0038]]）— machine
graph/        必須 skill の使用/省略と cycle 3指標（[[0039]]）
index/        三層知識の地図（catalog.json・[[0043]]）。派生。決定しない
learnings.md  実行ごとの worked / failed / edge cases（日記。正本ではない）
criteria/     判断基準 YAML — machine
benchmarks/   ハーネス監査スコア履歴
```

着手時の地図は `index/catalog.json`。index は派生でありデータ。
入場・被覆・不変条件の判断は Feature / criteria / policy の原文を読む。
learnings 全文と decisions 全件を1周で再読しない。

## ルール

- 新しい重要判断は必ず ADR を起票（連番）。過去 ADR を覆す時は新 ADR で廃止対象を明記する。
- ループの各タスク完了時に `learnings.md` へ追記し、必須 skill を `graph/events.jsonl` に記録する。
- **再現可能な改善・canon 変更は Feature を正本として起票**してから適用する（[[0038]]）。
- 判断が再現可能な閾値・ルールなら `criteria/*.yaml` に落とす。入場条件と不変条件は `policy/*.rego`。
- グラフは skill / Feature / cycle（[[0039]]）。

## ADR フォーマット

```
# ADR NNNN: タイトル
- 状態: 提案 | 受理 | 廃止（後継 NNNN）
- 日付: YYYY-MM-DD
- 背景: なぜこの判断が要るか
- 決定: 何を決めたか
- 結果: 結果・トレードオフ・将来の逃げ道
- 関連: [[他のADR]]
```
