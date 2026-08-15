# cursor-harness

Cursor 向けエージェント・ハーネス設計（`jp-code-agent` から切り出し）。

モデル戦略・自己成長ループ・agent/skill/hook・判断基準（knowledge）をまとめ、別プロダクトへ移植・参照できるようにしたリポジトリ。

## 構成

```
.claude/          agents / skills / hooks / AGENTS.md / CLAUDE.md
.cursor/          Cursor hooks
knowledge/        ADR・criteria・learnings・harness-audit 履歴
docs/superpowers/ ハーネス設計・監査スペック
scripts/          arch-fitness 機械ゲート
```

## モデル戦略（要約）

| 席 | モデル | 役割 |
| --- | --- | --- |
| 親チャット | Grok 4.6 | 壁打ち・ディスパッチ・統合・HOTL |
| Task ゲート | Opus 5 | plan-confirm / 敵対レビュー / verifier / reflector / 高リスク実装 |
| 第3レンズ | GPT-5.6 Sol | 高リスク3体多数決のみ |

詳細は `.claude/AGENTS.md` と `knowledge/criteria/model-routing.yaml`。

## 自己成長ループ

`計画 → plan-confirm → 実装(TDD) → 検証(敵対レビュー含む) → 内省 → Feature正本起票 → OPA入場 → harness-grow`

再現可能な改善の正本は `knowledge/features/F-NNNN-*.yaml`。入場は `node scripts/feature-gate.mjs`（OPA/Rego）。
learnings は日記であり、GitHub Issue は正本にしない。

## 由来

元リポジトリ: [marumo333/jp-code-agent](https://github.com/marumo333/jp-code-agent)

製品コード（SvelteKit / Supabase 等）は含まない。`CLAUDE.md` や一部 skill/hook には元プロダクト固有の記述が残るので、移植時はプロジェクトに合わせて調整する。
