# ADR 0032: 検証・UX・HOTL の subagent 化（廃止）

- Status: Superseded by [[0039-harness-template-cycle-graph]]
- Date: 2026-07-12
- Context: 製品 e2e / UX / HOTL をハーネスループに載せていた。template は製品を持たない。
- Decision: **撤回。** hermetic e2e・ux-reviewer・hotl-ops は template に置かない。
  検証の機械ゲートは `feature-gate` と cycle 3指標（[[0016]] / [[0038]] / [[0039]]）。
  製品リポ側で e2e/HOTL を足してよい。
- Consequences: 製品前提の agent/skill が消える。CI は feature-gate と（任意で）cycle after-merge。
- Links: [[0039-harness-template-cycle-graph]] [[0016-definition-of-done]]
