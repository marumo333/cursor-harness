# knowledge/ — 意思決定ログ & 手続きメモリ（自己成長ループの記憶層）

判断基準を**データとして保持**し、自己成長ループが**着手時に読み・内省時に書く**場所。

```
decisions/    ADR（1ファイル1決定。context/decision/consequences）。この会話の確定事項を seed 投入。
learnings.md  実行ごとの what worked / failed / edge cases（自己改善の記憶）。
criteria/     判断基準を YAML 化（コスト閾値・モデルルーティング・主権ルール・検索方針）。
benchmarks/   harness 監査スコア履歴（実行するほど改善を可視化）。
state.sqlite  ECC式セッション状態（.gitignore・ローカル記録）。
```

## ルール

- 新しい重要判断は必ず ADR を起票（連番）。過去 ADR を覆す時は新 ADR で `Supersedes` を明記。
- ループの各タスク完了時に `learnings.md` へ追記（CLAUDE.md 規約⑧・`post_task_reflect` hook）。
- 判断が再現可能な閾値・ルールなら `criteria/*.yaml` に落とす（エージェントが機械的に参照）。

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
