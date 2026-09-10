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
| 1 起票 | `knowledge/features/F-0007-dispatch-context-packet.yaml` | 本 PR。proposed + pending。paths はファイル単位 |
| 2 設計 | `docs/superpowers/specs/2026-09-10-dispatch-context-packet-design.md` | 本 PR。canon 外 |
| 3 ADR | `knowledge/decisions/0045-dispatch-context-packet.md` | 適用 PR。**新規のみ。** 既存 ADR を差分に入れない |
| 4 cycle 宣言 | `knowledge/graph/required-cycle.json` | ノードに `context_mode` |
| 5 criteria | `knowledge/criteria/model-routing.yaml` | 既定 effort と許容幅。幅1は上書き deny |
| 6 packet CLI | `scripts/lib/harness-query.mjs` `scripts/harness-query.mjs` | 名前は `C-NNNN.<node>.<seq>.json` |
| 7 テスト | `scripts/harness-query.test.mjs` | TDD。禁則キー・上限・空禁止・子キー deny |
| 8 配線 | `package.json` `.github/workflows/feature-gate.yml` | 新テストを列挙。偽グリーン禁止 |
| 9 ゲート許可 | `scripts/feature-gate.mjs` | PACKAGE_HOME に `packet.canon` だけ足す |
| 10 Rego | `policy/packet.rego` `policy/packet_test.rego` | deny 空だけ。grow/canon/feature は触らない |
| 11 計測 | `scripts/lib/cycle-metrics.mjs` `scripts/cycle-metrics.test.mjs` `scripts/cycle-record.mjs` | 観測専用。need_rerun を増やさない |
| 12 skill | 列挙した 6 本だけ | パケット必須。スポットライト囲み |
| 13 gitignore | `.gitignore` `knowledge/graph/packets/.gitkeep` | `*.json` を無視 |
| 14 完了記録 | learnings / events / catalog `--write` | [[0016]] |

**書き換えない:** F-0001 本体、既存 `knowledge/decisions/00*.md`（0045 以外）、`policy/grow.rego` `policy/canon.rego` `policy/feature.rego`、LangGraph、`.ts` 化。
票の paths を部分木に広げない。適用 PR で paths を足して自己拡幅しない。

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
- [ ] plan-confirm（C トリガ）→ 敵対レビュー **モード2（trio）** → verify
- [ ] 票の `proposed_change.paths` を適用 PR で広げない
- [ ] catalog `--write` / `--check`
