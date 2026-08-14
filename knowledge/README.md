# knowledge/ — 意思決定ログ & 手続きメモリ

判断基準をデータとして保持し、自己成長ループが着手時に読み・内省時に書く場所。

```
decisions/    ADR（1ファイル1決定）
features/     自己改善の作業正本（F-NNNN YAML・[[0038]]）
graph/        必須 skill の used/skipped と cycle 3指標（[[0039]]）
learnings.md  実行ごとの what worked / failed / edge cases（日記。正本ではない）
criteria/     判断基準 YAML
benchmarks/   harness 監査スコア履歴
```

## ルール

- 新しい重要判断は必ず ADR を起票（連番）。過去 ADR を覆す時は新 ADR で `Supersedes` を明記。
- ループの各タスク完了時に `learnings.md` へ追記し、必須 skill を `graph/events.jsonl` に記録する。
- **再現可能な改善・canon 変更は Feature を正本として起票**してから適用する（[[0038]]）。
- 判断が再現可能な閾値・ルールなら `criteria/*.yaml` に落とす。入場条件と不変条件は `policy/*.rego`。
- 製品の PRD / 案件グラフは置かない（[[0039]]）。

## ADR フォーマット

```
# ADR NNNN: タイトル
- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD
- Context: なぜこの判断が要るか
- Decision: 何を決めたか
- Consequences: 結果・トレードオフ・将来の逃げ道
- Links: [[other-adr]]
```
