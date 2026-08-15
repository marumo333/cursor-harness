---
name: parallel-dispatch
description: 実装の並列展開判断と起動手順（Task並列 / 作業ツリー分離 / 読み取り専用）。親Grokが計画を subagent に配る時に使う。
---

# parallel-dispatch skill（[[0031]] / [[0033]] / [[0040]]）

頭（**親 Grok**）が計画を subagent に配るときの判断基準と手順。

## 前提ゲート

1. **`plan-confirm` 承認証跡**があること（並列展開必須・[[0033]]）。無ければ起動しない。
2. **C トリガ**（正本/OPA/cycle/hooks の横断変更）は plan-confirm 同一 Task で
   `backend-architect` 設計レビュー済みであること。

## 並列化の判断基準（この順で判定）

1. **読み取り専用か？**（レビュー・探索・監査）→ **常に安全**。気軽に Task 並列起動してよい。
   3体多数決（`adversarial-review` モード2）もここに含まれる。
2. **書き込みタスク同士が独立か？**（触るファイル群が重ならない）
   → **同一ワークスペースで Task 並列起動**。1メッセージで複数 subagent を同時に起動する。
3. **同じファイル群に触る可能性がある / 同一タスクの複数試行（best-of-N）か？**
   → **作業ツリー分離**（best-of-n-runner）。採用しなかった側の学びは learnings に記録してから破棄する。
   採用後のレビューは通常どおり Opus 敵対。
4. **依存関係があるか？** → 並列にしない。逐次ディスパッチ、または境界を先に確定してから並列化する。

## ディスパッチの手順

1. superpowers `writing-plans` で **2-5分粒度**にタスクを分解し、各タスクの「触るファイル群」を明記する。
2. `plan-confirm` を通す。
3. 仕様が明文化できたタスクのみ `grok_task`（[[0040]] / `model-routing.yaml`）に委譲する。
   親 UI スラッグ（`chat_orchestrator`）を Task に渡さない。曖昧なタスク・非自明ロジックは Opus Task。
4. subagent への指示に必ず含める: 対象ファイル / 完了条件 / 読むべき ADR・criteria / 禁止事項。
5. 起動は 1メッセージにまとめる。完了後、**親 Grok が統合** → `adversarial-review` → `verify`。
   **並列展開の出力をレビューなしでマージしない。**

## アンチパターン

- plan-confirm なしの並列展開。
- 粒度が大きすぎる委譲。
- 同じファイルを触る2体を同一ワークスペースで並列起動。
- model 未指定の汎用 Task で Opus ゲートを代替すること。
- hooks から Task を自動起動すること（[[0033]]）。
