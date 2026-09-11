# 第3レンズ Muse Spark Implementation Plan

**Goal:** `review_trio` 第3を `muse-spark-1.3-medium` にし、文書と skill を揃える。

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

- [x] ADR 0046 と F-0008（proposed）を書く
- [x] criteria / skill / AGENTS / README を Muse に揃える
- [x] feature-gate と pnpm test（48/48、78/78）
- [x] モード2 trio（体3は Muse）。初回差し戻し、再レビューは 3/3 承認
- [x] catalog `--write` / `--check`
- [x] PR。F-0008 は proposed のまま
- [x] C-0007 を記録する（C-0006 は F-0007 側）
