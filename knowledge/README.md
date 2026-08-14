# knowledge/ — 意思決定ログ & 手続きメモリ（自己成長ループの記憶層）

判断基準を**データとして保持**し、自己成長ループが**着手時に読み・内省時に書く**場所。

```
decisions/    ADR（1ファイル1決定。context/decision/consequences）。この会話の確定事項を seed 投入。
features/     自己改善・ハーネス変更の**作業正本**（F-NNNN YAML。[[0038]]）。
learnings.md  実行ごとの what worked / failed / edge cases（日記。正本ではない）。
criteria/     判断基準を YAML 化（コスト閾値・モデルルーティング・主権ルール・検索方針）。
benchmarks/   harness 監査スコア履歴（実行するほど成長しているかを可視化）。
state.sqlite  ECC式セッション状態（.gitignore・ローカル記録）。
```

## ルール

- 新しい重要判断は必ず ADR を起票（連番）。過去 ADR を覆す時は新 ADR で `Supersedes` を明記。
- ループの各タスク完了時に `learnings.md` へ追記（CLAUDE.md 規約⑧・`post_task_reflect` hook）。
- **再現可能な改善・canon 変更は Feature を正本として起票**してから適用する（[[0038]]）。
  reflector は起票、harness-grow は OPA admit/apply allow の票だけ書く。
- 判断が再現可能な閾値・ルールなら `criteria/*.yaml` に落とす。入場条件と不変条件は
  `policy/*.rego`（`opa test` / `node scripts/feature-gate.mjs`）。

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
