# ADR 0037: ハーネス Claude ゲート席＝Fable 5 → Opus 5（骨格は 0033 維持）

- Status: Accepted（Amends: [[0033-harness-api-budget-routing]] [[0031-model-strategy-cursor-multi-family]]）
- Date: 2026-07-24
- Context: Claude Opus 5 が 2026-07-24 に GA。**Anthropic 公表**（第三者検証なし）では CursorBench 3.2
  （**max effort**）で Fable 5 ピークの ±0.5pt、Frontier-Bench v0.1 では Fable/Sol を上回る一方、API 単価は
  Opus 4.8 と同じ **$5/$25**（Fable 5 の $10/$50 の半額）。**thinking-high（≒xhigh）同士の直接比較数値は
  未公表**で、実運用 effort とのeffort mismatch がある点を認識した上で、0033 の枠温存（親 Grok＋Claude
  ゲート集中）を維持しつつゲート単価を下げる。精度論（独立検証・クロスファミリー）は [[0031]] のまま。
- Decision:
  - **Claude ゲート席の既定モデルを Opus 5 に差し替える**（Cursor ID: `claude-opus-5-thinking-high`）。
    対象: `backend-architect` / `auth-billing` / `security-reviewer`(既定) / `verifier` / `reflector` /
    `ux-reviewer`、および単独敵対レビュー・HOTL 診断・grow 前レビュー・plan-confirm。
  - **親チャット＝Grok 4.5 据え置き**。ピッカーで Opus/Fable に切り替えない（[[0033]] の budget_guards 継承。
    「親を Claude 系に戻さない」が本質）。
  - **実装 fan-out＝Grok 4.5 据え置き**。
  - **`review_trio`＝Opus 5（correctness）/ Grok 4.5（IDOR）/ GPT-5.6 Sol（secret・webhook）**。
    Sol の席制約は維持。**Fable と Opus を同一 trio に同居させない**（同 Anthropic ファミリーで
    多様性が消えるため。Claude 席は常に1系統）。
  - **Fable 5 は既定ロースターから外す**。許可される明示起動は次のみ:
    (a) 天井判断の追加レビュー、(b) 実装が Opus `auth-billing` のとき trio lens1 を Fable に**置換**
    （同居ではない・`no_fable_opus_cohabit_trio` と両立）。**ゲート席の既定代替には使わない**。
  - **effort**: コーディング／敵対レビューは Cursor の thinking-high（≒ xhigh）を既定とする。
    Anthropic 公表で max effort が一部ベンチで逆効果なため、ゲート席で max を既定にしない。
  - **不変条件の継承**: 独立 fresh context・敵対的レビュー、ハーネスモデルを製品頭脳の代役にしない、
    named agent 必須、Opus Task 入力は成果物のみ。
  - **rollback トリガ（可算）**: 次の高リスク trio を2回回し、Opus correctness レンズ固有の指摘が
    **合計0件**なら、lens1 を Fable に戻す（または再評価する）ADR を起票する。
- Consequences: 更新対象は `.claude/agents/*.md` frontmatter・`criteria/model-routing.yaml`・
  `code-quality.yaml`・`ux-quality.yaml`・`AGENTS.md`・`CLAUDE.md`・関連 skill・`post_task_reflect` hook・
  ADR 0016/0018/0031/0032/0033。0033 の席階層（親 First-party / ゲート Claude API / Sol＝trio のみ）は
  維持しつつ、ゲート単価を半減側へ寄せる。
- Links: [[0031-model-strategy-cursor-multi-family]] [[0033-harness-api-budget-routing]]
  [[0026-model-strategy-accuracy]] [[0016-definition-of-done]] [[0018-ai-security]]
  [[0032-ops-subagent-hotl]]
