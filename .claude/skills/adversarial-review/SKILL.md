---
name: adversarial-review
description: 独立敵対レビューの起動手順（全変更のデフォルトゲート）と高リスク3体3ファミリー多数決。実装完了後・前進判定の前に必ず使う。
---

# adversarial-review skill（[[0031]] / [[0033]] / [[0034]] / [[0037]]）

**原則: レビューは必ず実装と別の agent 呼び出し・fresh context・敵対的。可能な限り別モデルファミリー。**
同一 context の自己確認（「書いた本人が見直す」）は前進段を満たさない。
入力は **diff / 関連 ADR・criteria パス / 意図1-2行**のみ（実装時の思考過程は渡さない）。

## モード1: 単独敵対レビュー（全変更のデフォルトゲート）

1. 実装 subagent の完了後、**新しい** subagent を fresh context で起動する（実装セッションの続きで頼まない）。
   - 実装が Grok/GPT → レビューは Opus 5（`security-reviewer` か汎用レビュー）。クロスファミリーを自動確保。
   - 実装が Opus 5（高リスク Task）→ レビューも Opus 5 の別呼び出しで可（fresh context が最低条件）。
2. プロンプトは**敵対的**に書く。「チェックして」ではなく:
   「この diff を壊せ。間違っている箇所・抜けている edge case・攻撃可能な入力を探せ。
   問題が見つからない場合のみ approve。approve するなら何を検証してそう判断したか列挙せよ」
3. **architecture レンズ（必須・[[0034]]）**: FSD 依存方向違反、routes→adapters 直呼び、ports 外の SDK 直呼び、
   ADR 0002/0003/0034 との矛盾、層を跨いだ責務混入を探せ。
4. 渡すもの: 対象 diff / 関連 ADR・criteria のパス / 変更の意図（1-2行）。
5. 指摘あり → 担当 agent に最小再現付きで差し戻し（前進不可）。修正後は**再レビュー**（同じ手順で新 context）。

## モード2: 高リスク3体・3ファミリー多数決（認証/課金/セキュリティ/アーキ）

`security-reviewer` を **1メッセージで3体、Task 並列起動**する（読み取り専用のため worktree 分離は不要）。
各体はモデルとレンズを変える（**Sol はこの席のみ・[[0033]]**。Claude 席は Opus のみ・Fable 同居禁止・[[0037]]）:

| 体  | モデル（Task 起動時に指定） | レンズ                                                 |
| --- | --------------------------- | ------------------------------------------------------ |
| 1   | Opus 5（agent 既定）※       | correctness（ロジック・状態遷移・reserve→settle 整合） |
| 2   | Grok 4.5                    | テナント越境・IDOR・RLS 抜け                           |
| 3   | GPT-5.6 Sol                 | secret 漏れ・webhook 冪等性・出力サニタイズ            |

※ 実装が Opus `auth-billing` のとき、lens1 は **Fable（`fable_exception`）に置換**する
（実装と同モデルの correctness を避ける。Fable+Opus の**同居ではなく置換**なので `no_fable_opus_cohabit_trio` と両立・[[0037]]）。

- 判定: **過半数（2/3）が approve するまで前進不可**。1体でも Critical を挙げたら多数決に関係なく差し戻し。
- 3体の指摘は統合して1つの差し戻しレポートにする（重複排除・矛盾があれば親 Grok が裁定し learnings に記録）。
- 各体にも architecture レンズ（上記）を含める。

## 対象外

- docs/typo のみ（コード差分なし）はモード1省略可。コードに触れたら必須。

## 内省への接続

レビュー結果（どのファミリーが何を検出/見逃したか）は `reflect` skill のモデル別観点として
`knowledge/learnings.md` に記録する。
