# ADR 0031: Cursor ハーネスのモデル戦略＝クロスファミリー検証（頭の席は [[0033]] で改定）

- Status: Accepted（Supersedes: [[0026-model-strategy-accuracy]]；Amended by: [[0033-harness-api-budget-routing]] [[0037-opus5-gate-routing]]）
- Date: 2026-07-12
- Context: 開発ハーネスを Claude Code から **Cursor** に移行した。0026 の核「**精度は"1席あたりのモデルの
  大きさ"ではなく"独立した検証の深さ"で決まる**」は維持する。Cursor では subagent ごとに frontmatter
  `model:` で別ファミリーのモデルを割り当てられるため、独立検証を**クロスモデルファミリー**に拡張できる。
  同一ファミリー N 体の多数決は盲点（学習データ由来の思い込み）が相関し、多数決の統計的意味が弱い。
  別ファミリーは失敗モードが独立するため、同じ体数でも検証の実効的独立性が上がる。
- Decision: **Grok 実装 fan-out + 3ファミリー分散レビュー**を核とする（親チャット席は [[0033]]）。
  ※ 本 ADR の Claude ゲート席は起票時 Fable 5。既定は [[0037]] で **Opus 5** に改正（骨格は不変）。
  - **親チャット / オーケストレーション = Grok 4.5**（[[0033]]）。Claude ゲートは named Task の `model:` で起動。
    AGENTS.md の記載だけではモデルは切り替わらない。宣言的に効くのは agent frontmatter の `model:` のみ。
  - **実装 fan-out = Grok 4.5**（`api-builder` / `ui-builder` / `db-migrator`）。高速なので並列量産に向く。
    委譲するのは仕様が明文化されたタスクのみ（旧 Sonnet 席の規律を引き継ぐ）。独立レビューは免除しない。
  - **高リスク実装（auth-billing）= Claude ゲート（既定 Opus 5・[[0037]]）**。**実装席の推論努力は下げない**。
    reserve→settle・RLS・webhook 冪等性は推論の深さがそのまま事故率に効くため、medium 推論モデルを置かない。
  - **独立敵対レビュー（全変更のデフォルトゲート）= Claude ゲート・fresh context・敵対的**。実装が Grok の変更は
    自動的にクロスファミリーレビューになる。手順は `adversarial-review` skill。
  - **高リスク検証 = 3体・3ファミリー・多レンズ多数決**（**維持・[[0033]] / [[0037]]**）:
    `security-reviewer` を Task 並列起動×3、モデルを
    **Opus 5（correctness）/ Grok 4.5（テナント越境・IDOR）/ GPT-5.6 Sol（secret漏れ・webhook冪等性）**に
    割り当て、過半数が確認するまで前進不可。**ファミリー多様性は実装席でなくレビューで稼ぐ**のが本 ADR の核。
  - **内省（reflector）/ 前進判定（verifier）/ 設計（backend-architect）/ plan-confirm = Claude ゲート（Opus 5）**。
  - **不変条件（0026 から継承）**: レビューは必ず実装と独立した fresh context・敵対的。同一 context の
    自己確認で前進段を満たしたと見なさない。
  - **不変条件（新設・製品頭脳の分離）**: セマンティックレイヤーのプロンプト・抽出スキーマ変更
    （[[0029-semantic-layer-mining]]）は、ハーネスモデルの判断で完結させない。必ず実 `LlmPort`
    （Qwen3.6-27B 実機）に対する golden fixture 評価（入力サンプル→期待候補）で回帰確認し、結果を
    `knowledge/benchmarks/` に記録する。**ハーネスモデルを製品頭脳の代役にしない**（ハーネスモデルは自分の
    ファミリーの挙動を基準にプロンプトを最適化しがちで、Qwen の実挙動とずれる）。[[0023-self-evolving-ontology]]
    の HITL 採否ラベルは蓄積後、この golden set に転用する。
  - **モデル別学習の新設**: 内省時にモデル別の失敗モード・強み（どの席がどんなタスクで差し戻されたか）を
    `knowledge/learnings.md` に記録。蓄積後に `criteria/model-routing.yaml` へ昇格し、ロースター自体を
    自己成長ループの最適化対象にする。
- Consequences: 検証の独立性がファミリー横断で強化される。`.claude/agents/*.md` の `model:` は Cursor の
  モデルIDに書き換え（Claude Code 互換は捨てる。併用が必要になったら `.cursor/agents/` 複製で分離）。
  hooks（規約の強制力）は Cursor の third-party configs 設定を有効化して維持する。
  モデルIDの表記が Cursor 側で変わった場合は frontmatter の追従が必要（subagentStart hook で検証可能）。
  API 予算の席階層は [[0033]]。Claude ゲート既定は [[0037]]。アーキ fitness は [[0034]]。
- Links: [[0026-model-strategy-accuracy]] [[0016-definition-of-done]] [[0029-semantic-layer-mining]]
  [[0023-self-evolving-ontology]] [[0018-ai-security]] [[0024-autonomy-modes]]
  [[0033-harness-api-budget-routing]] [[0034-architecture-fitness-gates]] [[0037-opus5-gate-routing]]
