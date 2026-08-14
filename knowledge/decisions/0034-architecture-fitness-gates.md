# ADR 0034: アーキテクチャ fitness ゲート（廃止）

- Status: Superseded by [[0039-harness-template-cycle-graph]]
- Date: 2026-07-13
- Context: SvelteKit / Ports / RLS の層崩れを `arch:fitness` で見ていた。template に製品 src は無い。
- Decision: **撤回。** `scripts/arch-fitness.mjs` と `architecture-fitness.yaml` は置かない。
  ハーネスの構造ゲートは Feature 正本 + OPA + cycle グラフ（[[0038]] / [[0039]]）。
  architecture レンズは `adversarial-review` に残す（正本迂回・再起の無制限化・製品混入）。
- Consequences: 存在しない `src/` を検査しない。
- Links: [[0039-harness-template-cycle-graph]] [[0016-definition-of-done]]
