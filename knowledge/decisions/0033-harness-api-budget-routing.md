# ADR 0033: ハーネス API 予算ルーティング＝Grok 親 + Claude Task ゲート

- 状態: 受理（改正対象: [[0031]]；改正: [[0037]] [[0039]] [[0040]]）
- 改正注記: 親/並列展開の Grok 世代は [[0040]] で 4.6。親は常時 Grok・Claude は Task のみは維持。
- 日付: 2026-07-13
- 背景: 親を常時 Claude thinking-high にすると API 枠が枯渇する。精度ゲートは維持したい。
  親チャットのモデルは設定ファイルでは固定できず、subagent の `model:` は Task 起動時に解決される。
- 決定:
  - **親チャット = 常時 Grok 4.5**。ピッカーで Opus/Fable に切り替えない。
  - **Claude ゲートは名前付き Task の `model:` でのみ起動**。hooks からの Task 物理自動起動は不可。
  - **ゲート維持**: 単独敵対レビュー・高リスク3体多数決・verifier / reflector / grow 前レビュー。
  - **`review_trio`（Opus + Grok + GPT-5.6 Sol）は維持**。Sol は高リスクモード2の第3レンズのみ。
  - **plan-confirm**: 並列展開前のみ必須。`backend-architect` が計画を承認/差し戻し。専用 agent は作らない。
  - **トークン最適化**: Opus Task 入力は成果物のみ・新しい文脈。壁打ち全文の丸投げ禁止。
  - **親の直接編集**: 明文化済みボイラーのみ。編集後も敵対レビュー必須。
  - **方法論**: superpowers（brainstorming / writing-plans）継続。GitHub Spec Kit / Issues は正本にしない。
  - Claude ゲート既定モデルは [[0037]] で Opus 5。
- 結果: API 枠はゲート・高リスク・内省に集中。席の詳細は `criteria/model-routing.yaml`。
- 関連: [[0031]] [[0016]] [[0037]] [[0038]] [[0039]]
