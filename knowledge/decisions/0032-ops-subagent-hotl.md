# ADR 0032: 検証・UX・HOTL の subagent 化（廃止）

- 状態: 廃止（後継 [[0039-harness-template-cycle-graph]]）
- 現行注記: ハーネスを始める順は `TEMPLATE.md`（clone → ADR 技術選定 → Feature 起票 → マージ → 次 PR で実装）。HOTL は置かない。
- 日付: 2026-07-12
- 背景: 隔離 e2e / UX / HOTL をハーネスループに載せていた。検証の機械ゲートは feature-gate と cycle に閉じる。
- 決定: **撤回。** 隔離 e2e・ux-reviewer・hotl-ops は置かない。
  検証の機械ゲートは `feature-gate` と cycle 3指標（[[0016]] / [[0038]] / [[0039]]）。
- 結果: 継続検査は feature-gate と（任意で）cycle after-merge。
- 関連: [[0039-harness-template-cycle-graph]] [[0016-definition-of-done]]
