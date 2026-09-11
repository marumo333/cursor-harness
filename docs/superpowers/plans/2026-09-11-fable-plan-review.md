# 計画/レビュー Fable 5.1 Implementation Plan

**Goal:** plan-confirm と敵対レビューを Fable 5.1 high にし、運用の第3ピンを Muse に揃える。0044 決定本文は残す。

```yaml
plan_confirm:
  status: skipped
  c_trigger: false
  note: 単独の席ピン。並列展開なし。
tdd_exceptions:
  - config_chore
  - docs_only
```

## タスク

- [x] ADR 0047 と F-0009（proposed）を書く。適用経路は F-0001
- [x] criteria / skill / agent / AGENTS / README を Fable + Muse に揃える
- [x] 既存 ADR の決定本文は戻し、改正注記だけ現行ピンを書く
- [x] F-0007 spec の第3/Fable 行を 0046 / 0047 に合わせる
- [ ] モード2 trio（体1 Fable / 体2 Grok / 体3 Muse）。初回差し戻し、再レビュー待ち
- [ ] feature-gate と pnpm test
- [ ] catalog `--write` / `--check`
- [ ] C-0008 を記録する（C-0007 は F-0008 側）
