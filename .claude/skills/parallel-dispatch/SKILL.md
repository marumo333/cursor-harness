---
name: parallel-dispatch
description: 実装 fan-out の並列化判断と起動手順（Task並列 / worktree分離 / 読み取り専用）。親Grokが計画を subagent に配る時に使う。
---

# parallel-dispatch skill（[[0031]] / [[0033]]）

頭（**親 Grok**）が計画を subagent（実装 fan-out = Grok 4.5）に配るときの判断基準と手順。

## 前提ゲート

1. **`plan-confirm` approve 証跡**があること（fan-out 必須・[[0033]]）。無ければ起動しない。
2. **C トリガ**（新 Port / 新テーブル・RLS / 横断 feature / 機微 API 契約）は plan-confirm 同一 Task で
   `backend-architect` 設計レビュー済みであること（[[0034]]）。

## 並列化の判断基準（この順で判定）

1. **読み取り専用か？**（レビュー・探索・監査）→ **常に安全**。気軽に Task 並列起動してよい。
   3体多数決（`adversarial-review` モード2）もここに含まれる。
2. **書き込みタスク同士が独立か？**（触るファイル群が重ならない。例: UI コンポーネント量産と migration 作成）
   → **同一ワークスペースで Task 並列起動**。1メッセージで複数 subagent を同時に起動する。
3. **同じファイル群に触る可能性がある / 同一タスクの複数試行（best-of-N）か？**
   → **worktree 分離**（best-of-n-runner）。各ランナーが専用ブランチ＋専用ディレクトリを持つため衝突しない。
   実装試行席は **Grok**（First-party）。採用しなかった側の学びは learnings に記録してから破棄する。
   採用後のレビューは通常どおり Opus 敵対。
4. **依存関係があるか？**（AのAPIをBのUIが呼ぶ等）→ 並列にしない。逐次ディスパッチ、または境界（型・契約）を
   先に確定してから並列化する。

## ディスパッチの手順

1. superpowers `writing-plans` で **2-5分粒度**にタスクを分解し、各タスクの「触るファイル群」を明記する。
2. `plan-confirm` を通す。
3. 仕様が明文化できたタスクのみ Grok に委譲する（曖昧なタスク・非自明ロジックは Opus Task / auth-billing）。
4. subagent への指示に必ず含める: 対象ファイル / 完了条件（型緑・テスト）/ 読むべき ADR・criteria /
   禁止事項（担当 agent 定義の禁止事項を再掲）。subagent は親の会話を見えない前提で自己完結に書く。
5. 起動は 1メッセージにまとめる（並列実行になる）。完了通知を待つ間、親は次の計画・統合準備を進める。
6. 全 fan-out の完了後、**親 Grok が統合** → `adversarial-review` → `verify` の順でゲートを通す。
   **fan-out の出力をレビューなしでマージしない。**

## アンチパターン

- plan-confirm なしの fan-out。
- 粒度が大きすぎる委譲（30分級タスクを丸投げ）。
- 同じファイルを触る2体を同一ワークスペースで並列起動。
- 依存のあるタスクの投機的並列。
- model 未指定の汎用 Task で Opus ゲートを代替すること。
