# ADR 0033: ハーネス API 予算ルーティング＝Grok 親 + Fable Task ゲート

- Status: Accepted（Amends: [[0031-model-strategy-cursor-multi-family]] [[0032-ops-subagent-hotl]]；Amended by: [[0037-opus5-gate-routing]]）
- Date: 2026-07-13
- Context: Cursor Pro+ の API 枠（Fable/Claude/GPT 等）が、頭を常時 Fable thinking-high にした壁打ち・
  長大コンテキスト＋ツール再送・敵対レビュー多重呼び出しで枯渇した。精度ゲート（独立敵対レビュー・
  高リスク3体多数決）は維持したい。親チャットのモデルは設定ファイルでは固定できず、ピッカー切替運用は
  忘れやすい。subagent の `model:` は Task 起動時に自動解決される。
- Decision:
  - **親チャット = 常時 Grok 4.5 High Fast**（First-party）。ピッカーで Fable に切り替えない。
  - **Fable は named Task / subagent の `model:` でのみ起動**（既存 frontmatter）。起動自体は skill/DoD で必須化。
    hooks からの Task 物理自動起動は不可。
  - **ゲート維持**: 単独敵対レビュー（全変更）・高リスク3体多数決・verifier / reflector / grow 前レビューは Fable。
  - **`review_trio`（Fable + Grok + GPT-5.6 Sol）は維持**。Sol は高リスクモード2の第3レンズのみ
    （secret漏れ・webhook冪等性）。親・実装・plan-confirm・単独敵対では使わない。
  - **plan-confirm（新）**: fan-out（`parallel-dispatch`）前のみ必須。`backend-architect` Task が計画を
    approve/差し戻し。証跡を計画ファイルに残す。専用 agent は作らない。C トリガ（新 Port / 新テーブル・RLS /
    横断 feature / 機微 API 契約変更）時は同一 Task で設計レビューも兼ねる（[[0034]]）。
  - **token 最適化**: Fable Task 入力は計画 md / diff / 失敗ログ / ADR パスなど**成果物のみ・fresh context**。
    壁打ち全文の丸投げ禁止。ゲート代替の model 未指定汎用 Task 禁止。
  - **HOTL**: 手順 ops = 親 Grok。診断 = Task(Claude ゲート)。ops-runner 不設置は維持（[[0032]]）。
    ※ Claude ゲート既定モデルは [[0037]] で Fable 5 → Opus 5 に改正。
  - **親の直接編集**: 明文化済みボイラーのみ。非自明・高リスクは Task（auth-billing 等）。編集後も敵対レビュー必須。
  - **方法論**: superpowers（brainstorming / writing-plans）継続。GitHub Spec Kit は導入しない（成果物二重化回避）。
- Consequences: API 枠はゲート・高リスク・内省に集中。First-party（Grok）は親・fan-out・HOTL 手順で消費。
  親がゲートを飛ばすリスクは DoD 証跡で事後検出（事前機械強制は不可）。席の詳細は
  `knowledge/criteria/model-routing.yaml`。アーキ機械ゲートは [[0034]]。
- Links: [[0031-model-strategy-cursor-multi-family]] [[0032-ops-subagent-hotl]] [[0016-definition-of-done]]
  [[0034-architecture-fitness-gates]] [[0037-opus5-gate-routing]]
