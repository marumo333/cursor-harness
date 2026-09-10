# ディスパッチ packet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 親から子へ会話を継がず、context_mode 付き JSON packet と親だけの effort/escalate 上書きを機械契約にする。

**Architecture:** 照会は `scripts/harness-query.mjs`。形と許容幅は Rego。席骨格は触らない。会話 fork は置かない。

**Tech Stack:** Node 22 ESM（`.mjs`）、`node --test`、OPA v1.8。新規 npm 依存は置かない。

## Global Constraints

- 出生規則: 起票 PR は F-0007 を `proposed` のまま。同一 PR で admitted / approved にしない。
- 適用 PR は人間が起票 PR をマージしたあと。先頭で `admitted` にし `--admit` を通す。
- 0031 / 0033 / 0037 / 0039 / 0040 の席骨格は維持。
- 形の正本は Rego。TypeScript / Zod / Pydantic は入れない。
- 会話キー `learnings` / `conversation` / `decisions` / `session` は禁則。
- パケット上限 32768 バイト。超過は truncate せず非ゼロ。空パケットは書かない。
- hooks から Task を点火しない。
- commit 主語は conventional + 日本語。`--no-verify` 禁止。

```yaml
plan_confirm:
  status: pending
  agent: backend-architect
  at: null
  c_trigger: true
  note: 適用 PR の並列展開前のみ必須。本起票 PR は単独で plan-confirm 省略可。
```

---

## 触るファイル（適用 PR）

| タスク | ファイル | 備考 |
| --- | --- | --- |
| 1 起票 | `knowledge/features/F-0007-dispatch-context-packet.yaml` | 本 PR。proposed + pending |
| 2 設計 | `docs/superpowers/specs/2026-09-10-dispatch-context-packet-design.md` | 本 PR。canon 外 |
| 3 ADR | `knowledge/decisions/0045-dispatch-context-packet.md` | 適用 PR。新規のみ。既存 ADR を上書きしない |
| 4 cycle 宣言 | `knowledge/graph/required-cycle.json` | ノードに `context_mode` |
| 5 criteria | `knowledge/criteria/model-routing.yaml` | 既定 effort と許容幅 |
| 6 packet CLI | `scripts/lib/harness-query.mjs` `scripts/harness-query.mjs` | 0044 の未実装 |
| 7 テスト | `scripts/harness-query.test.mjs` | TDD。禁則キー・上限・空禁止・子キー無視 |
| 8 Rego | `policy/packet.rego` `policy/packet_test.rego` | 形と escalate 列挙 |
| 9 skill | budget / dispatch / review / verify / reflect / cycle | パケット必須を verify が見る |
| 10 計測 | `scripts/lib/cycle-metrics.mjs` | token_ledger。既存 3 指標は壊さない |
| 11 完了記録 | learnings / events / catalog `--write` | [[0016]] |

**書き換えない:** F-0001 本体、既存受理 ADR の本文、LangGraph 導入、`.ts` 化。

## タスク

### 起票 PR（今周）

- [x] F-0007 を `proposed` で追加する
- [x] spec と本計画を書く
- [ ] `node scripts/feature-gate.mjs` と `pnpm test` が緑
- [ ] 敵対レビュー（新しい文脈）。指摘があれば直して再レビュー
- [ ] learnings 追記と C-0006 の cycle 記録
- [ ] PR。同一 PR で admit しない

### 適用 PR（マージ後）

- [ ] status を `admitted` にし `node scripts/feature-gate.mjs --admit` を通す
- [ ] 失敗する `harness-query` テストを先に書く
- [ ] CLI を最小実装しテストを緑にする
- [ ] packet Rego と OPA テスト
- [ ] required-cycle と model-routing に mode / effort を書く
- [ ] skill をパケット入力に更新する
- [ ] plan-confirm（C トリガ）→ 敵対レビュー → verify
- [ ] catalog `--write` / `--check`
