# AGENTS.md — jp-code-agent ハーネス設計（モデル戦略・自己成長ループ・agent仕様）

`CLAUDE.md`（規約）と `knowledge/`（PRD/ADR/criteria）を土台に、実装をどう回すかを定義する。ハーネスは **Cursor**。

## モデル戦略（Grok 親 + Opus 5 Task ゲート + 3ファミリー分散レビュー）— [[0037]] / [[0033]] / [[0031]]

**精度は"モデルの大きさ"ではなく"独立した検証の深さ"で決まる**（0026 から継承）。Cursor では subagent ごとに
別ファミリーのモデルを割り当てられるため、独立検証を**クロスモデルファミリー**に拡張する（同一ファミリー
N 体の多数決は盲点が相関する）。**ファミリー多様性は実装席でなくレビューで稼ぐ**。API 枠はゲートに集中する（[[0033]] / [[0037]]）。

| モデル          | 役割                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Grok 4.5**    | **親チャット常時**（壁打ち・下書き・ディスパッチ・統合・HOTL 手順）＋実装 fan-out（api/ui/db/e2e-runner）        |
| **Opus 5**      | named Task のみ: plan-confirm・高リスク実装（auth-billing）・敵対レビュー・verifier・reflector・設計・HOTL 診断  |
| **GPT-5.6 Sol** | 高リスク3体多数決の第3レンズ（secret漏れ/webhook冪等性）**のみ**。実装席・親・plan-confirm・単独敵対には置かない |

**運用注記（Cursor の仕様）**:

- AGENTS.md の記載ではモデルは**切り替わらない**。宣言的に効くのは `.claude/agents/*.md` frontmatter の
  `model:`（Cursor モデルID）のみ。**親は常時 Grok**（ピッカーで Opus/Fable に切り替えない）。Opus は Task 起動で乗る。
- サブエージェントは同一チャット内の Task 起動で親と別モデルで並列に走る（別タブ不要）。
- セマンティックレイヤーのプロンプト・抽出スキーマ変更は、ハーネスモデルの自己判断で前進不可。
  必ず実 `LlmPort`（Qwen3.6-27B 実機）への golden fixture 評価で回帰確認する（[[0031]] 不変条件・
  ハーネスモデルを製品頭脳の代役にしない）。
- 席の詳細・`budget_guards` は `knowledge/criteria/model-routing.yaml`。手順は `harness-api-budget` skill。
- **Fable 5** は既定ロースター外（[[0037]]）。天井判断の追加起動、または auth-billing 実装時の trio lens1
  **置換**のみ可（ゲート既定代替は禁止）。

方法論(計画/TDD/review)は superpowers、UI は frontend-design、自己成長機構は ECC(lean 最適化) を利用。
**精度の主レバー＝独立検証**:

- **plan-confirm（fan-out 前）**: `backend-architect` Task（Opus 5）。approve 証跡が無い fan-out は DoD 違反（[[0033]]）。
- **独立敵対レビュー（全変更のデフォルトゲート）**: 実装と**別の agent 呼び出し・fresh context**で、
  「壊せ／どこが間違っているか探せ」と**敵対的**に走らせる（Opus 5）。実装が Grok の変更は自動的に
  クロスファミリーレビューになる。自己レビューでは前進段を満たさない。手順は `adversarial-review` skill。
  **architecture レンズ必須**（[[0034]]）。
- **高リスク検証（認証/課金/セキュリティ/アーキ）**: `security-reviewer` を **Task 並列起動×3・3ファミリー・
  多レンズ**（Opus=correctness / Grok=テナント越境・IDOR / GPT-5.6 Sol=secret漏れ・webhook冪等性）で多数決、
  過半数が確認するまで前進不可。読み取り専用なので worktree 分離は不要。起動手順は `adversarial-review` skill。
- **アーキ fitness（機械）**: `npm run arch:fitness` が DoD（[[0034]] / [[0016]]）。

## 自己成長ループ（各タスク=1周）

1. **自走(親=Grok)**: `knowledge/` 読込 → superpowers `brainstorming` / `writing-plans` で 2-5分粒度に分解。
   **fan-out 前に `plan-confirm`（Opus Task）**。並列化は `parallel-dispatch`。C トリガ（新 Port / 新テーブル・RLS /
   横断 feature / 機微 API 契約）時は同一 Task で `backend-architect` 設計必須（[[0034]]）。
2. **実装(高リスク=Opus Task / 明文化タスクは Grok fan-out)**: superpowers TDD（**red 観測→最小 green**。
   挙動変更は必須・[[0013]]）。親の直接編集は明文化ボイラーのみ。製品コードを先に書いてテストを後付けしない。
3. **検証(verifier+hooks+plugins)**: `pre_commit_guard`(型/secret) → `arch:fitness` → Playwright e2e →
   **独立敵対レビュー(Opus・全変更・arch レンズ)** → 高リスクは `security-reviewer` 3体・3ファミリー多数決。
   **独立レビュー未通過・失敗は差し戻し・前進不可**（[[0016]]）。
4. **内省(Opus Task / reflector)**: 効いた/失敗/edge case を言語化。**モデル別の失敗モード・強みも記録**。
   再現可能な改善は `knowledge/features/F-NNNN-*.yaml` に**正本起票**する（直接昇格しない・[[0038]]）。
5. **成長(harness-grow)**: OPA `grow.admission` allow の Feature だけ skill/ADR/criteria/`policy/learned` に適用。
   `node scripts/feature-gate.mjs` 緑・`harness-audit` 再スコア。
6. **ガード**: budget_guards / observer-loop 防止 / 検証失敗停止。
   → 1周ごとに knowledge/skills が増え、次周が前回の学びを前提に走る＝**複利成長**。

## agent 定義の仕様（`.claude/agents/*.md`）

- **frontmatter**: `name` / `description`(いつ使うか) / `model`(**Cursor モデルID**。実証済みスラッグ:
  `claude-opus-5-thinking-high`（2026-07-24 Task 解決確認） / `grok-4.5-fast-xhigh` / `gpt-5.6-sol-medium`。
  Claude Code エイリアス opus/sonnet は使わない — 実測でエイリアス `sonnet` は 4.6 に解決された。
  **Sonnet を使う場合は一律 Sonnet 5**（`claude-sonnet-5-thinking-high` を明示指定）。定義は**セッション開始時に
  読込**のため変更後は再読込が必要) / `tools`(許可リスト) / `isolation`(必要時 worktree)。
- **本文(system prompt)**: 役割・スコープ／責務／**禁止事項**／着手前に読む物(CLAUDE.md＋関連ADR/criteria)／
  入出力・ハンドオフ形式(構造化)／**検証義務**(hooks/test 通過後に返す)／エスカレーション条件。
- **Opus ゲートは named agent 必須**。`generalPurpose` 等の model 未指定 Task でゲート代替禁止（[[0033]] / [[0037]]）。

## ロースター

| agent               | model         | 責務                                                                                           | レビュー/ゲート                            |
| ------------------- | ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `backend-architect` | Opus 5        | API/DB/ports 設計・ADR 起票・**plan-confirm**                                                  | 独立敵対レビュー                           |
| `auth-billing`      | Opus 5        | 認証・reserve→settle・RLS・Stripe webhook（高リスク）                                          | 3体3ファミリー多数決                       |
| `api-builder`       | Grok 4.5      | `+server.ts`/services/repositories                                                             | 独立敵対レビュー(Opus 5)                   |
| `ui-builder`        | Grok 4.5      | FSD widgets/features（frontend-design 併用・定型量産）                                         | 独立敵対レビュー(Opus 5)＋**ux-reviewer**  |
| `db-migrator`       | Grok 4.5      | migration・RLS ポリシー                                                                        | 独立敵対レビュー(Opus 5)＋高リスクは多数決 |
| `e2e-runner`        | Grok 4.5      | hermetic Playwright 実行・失敗ログ収集（**判定しない**）                                       | —                                          |
| `ux-reviewer`       | Opus 5        | UI 意味レビュー（ADR0017 / ux-quality。主観美は見ない）                                        | —                                          |
| `security-reviewer` | Opus 5(既定)※ | OWASP LLM/Agentic Top10（間接注入/過剰agency/出力/テナント越境/IDOR/secret）。**独立・敵対的** | —                                          |
| `verifier`          | Opus 5        | 型・lint・arch:fitness・e2e-runner 結果判定・ux-reviewer 確認・敵対レビューの前進判定          | —                                          |
| `reflector`         | Opus 5        | 内省→learnings 追記＋Feature 正本起票（適用は OPA 入場後の harness-grow）                       | —                                          |

HOTL（実機 e2e/デバッグ/運用）は **親 Grok 直轄**（`hotl-ops` skill）。診断は Opus Task。`ops-runner` は置かない（[[0032]] / [[0033]]）。

※ 高リスク3体多数決では、頭が `security-reviewer` を Task 起動時にモデル指定で Grok 4.5 / GPT-5.6 Sol にも
割り当てる（`adversarial-review` skill 参照）。実装系（`api-builder`/`ui-builder`/`db-migrator`/`e2e-runner`）は Grok のため、
Opus 5 の独立敵対レビューが**自動的にクロスファミリー**になる。レビュー系（`security-reviewer`/`verifier`/`ux-reviewer`）は
実装と別 agent・fresh context で走らせること（自己レビュー禁止）。
`ui-builder` 成果物がある変更は **ux-reviewer(Opus) 必須**。

## jp-code-merge との境界

接続は **endpoint 契約①下り＋データ②上り** の2つのみ（`../jp-code-merge/BOUNDARY.md`）。merge には書き込まない
（`block_jp_code_merge_write` hook）。配信レシピは merge/deploy 所有、agent は運用のみ。
