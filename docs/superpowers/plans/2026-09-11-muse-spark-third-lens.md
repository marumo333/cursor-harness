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
- [ ] feature-gate と pnpm test
- [ ] モード2 trio（体3は Muse）
- [ ] catalog `--write` / `--check`
- [ ] PR。F-0008 は proposed のまま
