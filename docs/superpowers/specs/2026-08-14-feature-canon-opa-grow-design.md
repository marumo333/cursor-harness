# Feature 正本 + OPA grow 入場 — 2026-08-14

## 問いへの答え

1. **自己改善ループはある。Feature 正本としての起票は、導入前は無かった。**
   正本は `knowledge/features/F-NNNN-*.yaml`。learnings は日記。GitHub Issue は正本にしない。
2. **OPA は入場に使うと精度が上がる。生成には使わない。**
   何を学ぶかは LLM、昇格してよいかは Rego。学習不変条件は `policy/learned/` に蓄積できる。

## 流れ

```
reflector: learnings 追記 + Feature 起票（proposed）
        → 敵対レビュー
        → opa admit allow → status=admitted
harness-grow: opa apply allow の票だけ skill/ADR/criteria/Rego に適用
verify: node scripts/feature-gate.mjs
```

入場は fail-closed（キー欠落 deny、mutates は差分導出、bootstrap は導入ファイルが差分にある時だけ、
merge-base 未解決は exit 1）。canon パスの正本は `policy/canon.rego`。複数票は和集合。

## 非目標

- GitHub Spec Kit / Issue を正本にする（[[0033]]）
- 内省文や skill 本文を Rego で生成する
- 製品 RLS/課金を OPA に移す（別判断）
