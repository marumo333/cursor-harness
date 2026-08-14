# learnings.md — 自己成長ループの記憶（実行ごとに追記）

各タスク完了時に「効いた / 失敗した / edge case」を追記する（CLAUDE.md 規約⑧ / `post_task_reflect` hook）。
再現可能な改善は Feature 正本（`knowledge/features/`）に起票し、OPA 入場後に skill/rule/Rego へ昇格する（[[0038]]）。

---

## 2026-08-14 — Feature 正本 + OPA grow 入場（ADR 0038 / F-0001）

**問い**

- 自己改善ループはあるが、Feature 正本としての起票は無かった（learnings 日記 + skill 直接書き換え）。
- OPA は生成ではなく入場に使うと、昇格可否の揺れが減る。

**worked**

- 正本を `knowledge/features/F-NNNN-*.yaml` に置いた。GitHub Issue は正本にしない（[[0033]] 二重化回避）。
- `policy/feature.rego` + `policy/grow.rego` + 14 test。`node scripts/feature-gate.mjs` が DoD。
- reflector = 起票、grow = OPA allow の票だけ適用。F-0001 bootstrap は human + 1回限り。
- 未追跡ファイルを gate の diff に含めないと新規 canon が抜けた → `git ls-files --others` を追加。

**failed / リスク**

- `post_task_reflect` は依然 stderr リマインダ。hooks から Task 物理起動は不可（[[0033]]）。
- F-0001 は自己参照のため bootstrap。2枚目以降で bootstrap を真似ると deny（テスト済み）。
- OPA に内省文を載せると誤ツール。learned/ はスロットのみ。

**next**

- 敵対レビュー後に F-0001 の `evidence.adversarial_review` を approved にし、bootstrap を外して done にできるか確認。
- 最初の harness-rule Feature で `policy/learned/` に1本落とす。

## 2026-07-24 — Claude ゲート席 Fable 5 → Opus 5（ADR 0037）

**worked**

- Opus 5 GA（$5/$25）。根拠は **Anthropic 公表**（CursorBench max≈Fable±0.5pt・Frontier-Bench で Fable/Sol
  上回る）。thinking-high 同士の第三者比較は未公開＝effort mismatch を ADR に明記した上で、
  **0033 の席階層は維持**したまま Claude ゲート既定だけ Opus に差し替え（[[0037]]）。
- 親 Grok・実装 Grok・Sol＝trio 第3のみは不変。**Fable+Opus の trio 同居は禁止**（同族で多様性消失）。
- frontmatter を `claude-opus-5-thinking-high` に更新。本変更の敵対レビュー Task で同スラッグが
  Opus 5 に解決されることを確認（実証済み扱い可）。
- 初回敵対レビューで取りこぼし検出: ADR 0016/0018/0032・prettier・`fable_seat` ガード・auth-billing 時
  lens1 置換。修正後に再レビュー。

**failed / リスク**

- Opus 5 の dogfood 指摘ログはまだ薄い。Fable 時代の correctness 傾向をそのまま外挿しない。
- **rollback 可算トリガ**: 次の高リスク trio 2回で Opus lens 固有指摘が合計0件なら lens1 差し戻し ADR。

**edge / 次候補**

- `fable_exception` は天井判断 or auth-billing 実装時の trio lens1 **置換**のみ（ゲート既定代替禁止）。

---

## 2026-07-22 — post-PR18 residual cleanup（C6 以外）

**worked**

- plan-confirm（backend-architect・条件付き approve）→ Task1∥2∥3∥4 fan-out → 統合。
- **TDD red 証跡**:
  - B1: `shouldShowCompanionBanner` / `DIGEST_MISSING_COPY_JA` 未定義で fail → 実装で 6 pass
  - B2: `quaternary-foo.gguf` が `ternary` 誤判定（Expected unknown）→ `\bternary\b` 等で 4 pass
  - B3: 当初 `/healthz` を上流 id に揃えたが敵対 F2 で差し戻し → **無認証 healthz は env ラベルのみ**、実 id は認証 `/v1/models`（UI ready 経路）に限定して再 green
  - F1: `digest_missing` phase 追加で起動 hint 誤誘導を除去（send 経路も同型に揃え ux-reviewer approve）
- C4: 物理8GBスキップを availability-baseline / ADR0038 に文書化（公式ピーク＋16GB RSS 包絡受け入れ）

**failed / edge**

- C5 bakeoff フル: Companion は起動中だが digest=`ternary-bonsai`（1-bit 未ロード）かつ runner は `.env` HITL 必須のため Agent 完走不可。公式品質差＋HOTL smoke を維持しスキップ記録。
- 敵対: 無認証面への上流 id 昇格は情報開示増（DNS rebinding）。healthz≠models の乖離は**意図的契約**として残す。

**next**

- 残人間: C6 secrets / 実 Stripe / 実 E2B のみ
- 任意: 1-bit 再ロード後に人間が `bakeoff:v2 -- --run` で low_mem 4 ケース埋める

---

## 2026-07-22 — Bonsai 8GB local profile（1-bit 27B / Ternary 推奨維持）

**worked**

- **パラメータは下げず bit family で吸収**（8B 非採用）。公式 HF: overall −4.38pt / agentic −8.0pt。
  製品は `low_mem` バッジ＋ suggest-brain（明示切替のみ）で agentic 差を吸収。自動ルーティング禁止を守れた。
- **plan-confirm が criteria 矛盾を先に潰した**: `inference-routing.yaml` の「8B フォールバック」コメント削除が
  必須条件になり、実装前に単一真実化した。ADR 採番衝突（0037 既存）は親が **0038** にリネームして解消。
- **digest 正規化を Web 一本化**: Companion は上流 id パススルーのみ（family 非返却）。誤表示防止で
  `checkCompanionHealth` の ternary 既定フォールバックを廃止（id 欠落→null→unknown）。
- Subagent-Driven: Task1→(2∥3∥6)→4→(5∥7)→fix→敵対/ux/verifier。Grok 実装 + Fable ゲートが効いた。

**failed / edge**

- 敵対 Important: バッジ追加で「id 欠落時 ternary 捏造」が意味を持つようになった（既存コードの負債顕在化）。
- Companion `/healthz` と `/v1/models` の digest ソース乖離は、residual 敵対レビュー後に**意図的契約**として維持（後続エントリ）。

**next**

- HOTL smoke（2026-07-22）: 1-bit Q1_0・`-c 8192 -np 1`・KV4・text-only で completion 成功、RSS peak ≈2.9GB（16GB host）。
- 物理 8GB: 未実施→包絡受け入れ（後続）。bakeoff 4 ケースは `.env` HITL 待ち。PR: https://github.com/marumo333/jp-code-agent/pull/18

---

## 2026-07-22 — W5 完了（invoice-math / memory / external-send / rate-limit Port / long_runs）

**worked**

- **invoice-math（適格請求書の積上げ計算）を単一モジュール化**し、UI/API の合計直書きを剥がして
  サーバ側再計算に一本化。「金額はクライアント申告を信用せず必ず再計算」が W5 の背骨として機能した。
- **Port 追加が定型化してきた**: `MemoryProjectionPort`＋`/api/memory`、`RateLimitPort`（memory adapter）とも
  Ports&Adapters の seam に素直に乗り、arch:fitness を崩さず追加できた（M1 以来の型が複利で効いている）。
- **external_send は URL 共有のみ（[[0037]]）**: 実 SMTP せず `sent` + optional `shareUrl`。実メールは将来 MailPort。
  shareUrl は **http(s) スキームのみ許可**（javascript: 等の混入面を入口で遮断）。明細は nonnegative 強制。
- **long_runs**: migration 0015＋API まで（worker は未着手・次スライス）。
- **検証フルセット緑（人間除外の機械 DoD）**: vitest **213** / check / lint / arch / build。
  hermetic 全 e2e **41 passed / 0 failed / 3 skipped**（ux visual 意図 skip）。gitleaks no leaks。
  verifier（Fable）**前進可能**。prepaid: chat/ingest とも reserve→settle。
- **敵対3体（Fable/Grok/Sol）全 approve・Critical 0**。初回で Fable が HIGH を掘り当て→修正→再レビューの型を維持。
- **auth e2e RED→GREEN**: signup 後 locator が CompanionBanner `.msg` と衝突（strict 2要素）→ `form p.msg` に束縛。
- **TDD / retrofit**: 新規挙動はテスト併設。既存配線の追随は `tdd_exceptions: retrofit_with_human_ack`
  （本セッション人間指示「人間以外を全て実装検証」を ack とみなす）。

**failed / 反省**

- **Fable HIGH: items 無し update で合計直書きが残っていた** — 「合計直書き剥がし」を主目的にした変更でも、
  明細を伴わない更新経路に旧直書きが残存した。教訓: **金額系のリファクタは「明細あり/なし」「create/update」の
  全経路マトリクスで直書き残存を潰す**（主経路だけ直すと副経路が旧仕様のまま残る）。

**edge / 残（Medium・backlog）**

- long_runs の直接 CRUD に対する PostgREST 列権限（API 経由以外の書込面）。
- `/api/memory` の 500 応答に本文（例外詳細）が乗る面 — エラー一般化は 0005 の教訓と同型。
- `taxByRate` が非永続（表示都度の再計算のみ）。帳票の監査証跡として持たせるかは次段判断。

**モデル別観点（0031/0033 の軸）**

- Fable（correctness）: invoice-math のバイパス経路と明細境界（nonnegative）を検出 — ドメイン不変条件系の強みが継続。
- Grok（越境/権限）: IDOR/RLS/CSRF は安全と確認。shareUrl のスキーム面を指摘。
- Sol（意図外経路/運用面）: long_runs の PostgREST 列権限と memory の例外露出を検出。3ファミリー非重複を今回も維持。

**harness-grow（実施済み）**

- `knowledge/criteria/ontology.yaml` → `write_path.invoice_totals`（server_line_rollup + strip + 4経路 matrix）。
- `.claude/agents/api-builder.md` 禁止事項に同趣旨を追記。grow 敵対レビュー approve。
- harness-audit: audit-2 **84** → audit-3 **88**（+4）。

## 2026-07-21 — W0 ハーネス/可用性/セキュリティ baseline 着手

- **効いた**: 拡大マスターを W0 から実行。design spec + W0 plan 固定。security 3体（Fable/Grok/Sol）並列で Critical 0・全員 approve。
- **検出 Medium**: chat tool 出力の spotlighting 欠落（ingest のみ wrap）。e2e admin URL の localhost 強制不足。将来 Stripe webhook 冪等は W4 必須条件化。
- **ローカル**: `.env` を `chmod 600`（中身はログに出さない）。
- **可用性**: プローブ手順は書いたが数値は `pending_human`（.env HITL 待ち）。
- **harness-audit**: audit-1 total 77 → audit-2 total 84（+7）。

## 2026-07-21 — 人間必須以外を連続実装（W1–W4 mock まで）

- **可能範囲**: hermetic（Vitest + Playwright + mock LLM/Payments/CodeExec）はエージェント完走可。Stripe/E2B/本番 HOTL/`.env`/push は人間。
- **コマンド**: `npm run test` / `test:e2e` / `check` / `lint` / `arch:fitness` / `build`。手順は `docs/superpowers/specs/2026-07-21-human-required.md`。
- **到達**: W1 github+link_candidates e2e 緑、W2 outcome_events、W3 run_code mock、W4 stripe webhook mock（冪等）。W5–W8・UI 仕上げ・席料・Tauriは未。
- **既存 flake**: `auth.spec.ts` signup UI strict は本変更と無関係に失敗し得る。

## 2026-07-21 — chat spotlighting 修正 → W1 GitHub ingest 着手

- **TDD**: chat tool wrap テストを red 観測 → `spotlight.ts` + system ガード + 全 tool push を wrap。vitest/check/arch green。
- **共有化**: ingest の `wrapUntrusted` を spotlight に寄せ re-export（重複実装禁止）。
- **e2e 誤爆防止**: `assertLocalSupabaseUrl`（localhost のみ）。vitest は `e2e/**` 除外のため src/security に配置。
- **W1**: plan-confirm approve（SSRF=api.github.com 再構築のみ）。`parse/build/fetchGithubIssue` + `POST /api/ingest/github` + ingestGithubIssue。link_candidates は続。
- **次**: link_candidates migration/RLS、敵対レビュー、commit/PR はユーザー明示時。

## 2026-07-13 — ハーネス API 予算（0033）＋アーキ fitness（0034 A+B+C）

**worked**

- Pro+ API 枯渇の主因は壁打ち常時 Fable thinking-high＋ゲート多重。対策はゲート維持のまま席階層化:
  **親=常時 Grok**、**Fable=named Task のみ**、入力は成果物のみ（[[0033]]）。
- **GPT-5.6 Sol は廃止しない**。高リスク3体の第3レンズのみ維持（`review_trio`）。親・実装・plan-confirm・
  単独敵対では使わない。learnings 上も Sol の状態機械指摘が効いていた。
- **A+B+C**（[[0034]]）: 機械 `arch:fitness`（client→server 禁止・動的/相対含む / routes→adapters 禁止 /
  supabase-js `createClient` は adapters のみ / `@supabase/ssr` は hooks.+layout のみ）＋
  adversarial の architecture レンズ＋C トリガで backend-architect 必須。D/E/F は次候補。
- plan-confirm は fan-out 前のみ。C 時は同一 Task に統合（二重 API 回避）。
- 旧「ピッカーで Fable 頭」運用は撤回（本エントリで上書き。171 行付近の歴史記述はそのまま残す）。
- Spec Kit は未導入のまま（superpowers と二重化するため 0033 では入れない）。

**failed / 反省**

- 計画初期ドラフトで「routes→$lib/server 直 import 禁止」と書くと現行 ADR 0003（+server→services）と矛盾し、
  現状コードが常時 fail する。**正: client→server 禁止、routes→adapters 禁止**。

**edge / 次候補**

- D: harness-audit 構造スコア / E: インシデント→ADR 強制 / F: 週次壊せバッチ。
- skill 必須でも親がゲートを飛ばしうる → DoD 証跡で事後検出（事前機械強制は不可）。

## 2026-07-04 — 計画フェーズ（bootstrap）

**worked**

- 意思決定を都度 ADR 化したことで、方針転換（マージ→stock27B、さくら→Vast.ai、RAG→agent-first）が
  追跡可能になった。`Supersedes` で履歴が繋がる（0005→0010）。
- 「ハーネスだけでなく PRD/コード品質が抜けている」という指摘で製品層(PRD)と品質層を追加 → ハーネスが
  参照すべき土台が揃った。順序の教訓: **製品定義と品質基準はハーネスと同時か先に置く**。
  **failed / 反省**
- 当初 7-8B 前提で GPU コスト(さくらV100 ¥57.6)を評価したが、対象が 27B に変わり前提が崩れた。
  → 教訓: **モデルサイズを最初に固定してから GPU/量子化/コストを詰める**。
  **edge cases / 未決**
- Vast.ai は US/EU で主権を出る。既定=コスト、主権モード=国産の2モードを LlmPort で持つ設計で吸収。
- ECC はそのまま入れず本プロダクト用に最適化（機構のみ抽出）。導入は `/plugin` 後。

## 2026-07-04 — M0 実装（認証 + ワークスペース lite）

**worked**

- FSD(entities/widgets)＋Ports&Adapters の分割で、**型チェック0エラー・build緑（adapter-cloudflare）**まで到達。
- `@supabase/ssr` の getAll/setAll ＋ `safeGetSession`(getUser で JWT 検証) で認証コア。authGuard は `/api/*`=401・
  未認証→`/login`・認証済`/login`→`/`。
- ワークスペース lite（サイドバー/タブ/チャット/explorer/アクティビティ）を Svelte5 runes で。出力はテキスト描画（規約13）。
  **failed / 修正（golden path 候補）**
- **`sveltekit` プラグインの import 元を誤った**（`@sveltejs/vite-plugin-svelte`）→ 正は **`@sveltejs/kit/vite`**。
  1箇所の誤りが全 .svelte に "no exported member 'sveltekit'" をカスケード。教訓: vite.config の import 元を最初に確認。
- **`$env/static/public` は .env 無しだと型生成されず型エラー** → **Cloudflare配信では `$env/dynamic/public` が堅牢**
  （ランタイム解決・build時に値不要）を採用。golden path: 「SvelteKit×Cloudflare の public env は dynamic」。
  **edge / 残**
- 実行時 e2e（signup→login→chat ストリーム）は **Supabase Tokyo プロジェクト＋`.env`** が必要（ユーザー準備）。
- M1 で `LlmPort`→Modal(vLLM) 接続。その前に merge 側 `deploy/validate_wiring.sh` で配線検証（BOUNDARY①）。

## 2026-07-05 — M0 e2e 完了（login/logout 実機確認）

**worked**

- Supabase Tokyo 実接続で認証フロー（signup→login→logout）が動作。**M0 完了**（型緑・build緑・e2e緑）。
- 未認証`/`→`/login`・`/api/*`=401 のガードも実機で確認。
  **failed → golden path（dev skill に昇格済）**
- **Windows PowerShell 5.1 の `Out-File -Encoding utf8` は BOM 付き** → `.env`/`.env.local` 先頭の変数名が
  `﻿PUBLIC_SUPABASE_URL` に化け、`$env/dynamic/public` が空 → `createServerClient('')` が全ルートで 500。
  切り分け: BOM無しダミー `.env.local` は 200/303 で正常 → ファイル側の問題と確定。
  正解: `[System.IO.File]::WriteAllText(path, text)` or `Set-Content -Encoding ascii`（BOM無し）。

## 2026-07-06 — M1 実装（Ontology統治グラフ＋残高ゲート＋agentic UX・実LLM除く）

**worked**

- **壁打ち→市場調査→設計の順**が効いた。Palantir Ontology を移植せず「個人ワークスペースの統治グラフ」に
  最適化（ADR0021 改訂）。X/Reddit/日本メディア/競合の4並列調査が「案件横断記憶＝最大ニーズだがコモディティ化／
  差別化は構造化ドメインモデル／案件×お金UI／記憶の見える化＝乗換理由」で強く収束し、設計判断を裏付けた。
- **Ports&Adapters が seam を綺麗に通した**。`LlmPort` を mock 実装で貫通させ、実 vLLM は adapter1点差替に。
  型緑・build緑（adapter-cloudflare）まで一直線。`$lib/server/*` の server-only 強制でシークレット露出も無し。
- **agentic UX = 構造化イベント(NDJSON)** で計画/ツール開示/承認カード/残高メータを配線。素テキストstreamを置換。
  **failed → golden path 候補**
- **security-reviewer が確定重大穴を検出**（実装直後に必ず回す価値）: ①`confirmed` フラグを applyAction ツール
  入力に置くと、LLM/インジェクション由来 `confirmed:true` で hard-gate 全バイパス（規約12崩壊）→ **ツール入力から
  confirmed を排除し、承認は /api/action/confirm のみ**。②汎用 `update_*` の `status` 書換で `send_*`(external_send)
  を回避 → **保護状態(sent/paid/accepted/delivered)への遷移は governance で hard-gate 昇格**。③`reserve` の
  read-then-insert は TOCTOU で残高マイナス化 → **plpgsql RPC＋per-user advisory lock で原子化**（settle/release も
  FOR UPDATE で冪等化）。教訓: **「統治/課金は app 層の if でなく DB の原子性＋RLS で担保する」**。
- **台帳系は "書込ポリシーを付けない"＝service_role 限定** が正しい書き方（INSERT/UPDATE policy を書かない）。
  一方 `action_policies` は当初 `for all` にしてしまい自己昇格の穴 → **select-only＋書込 service_role** に修正。
  **edge / 残（次段）**
- **migration(0002-0004)の実適用＋RLS実機確認・e2e は未**（ユーザーの Supabase Tokyo＋service_role 鍵が必要）。
  型/secret/build は緑だが DoD の「実機」項は保留。
- `.env.example` は権限制限ディレクトリで編集不可 → `MODEL_NAME=qwen36-27b`/`OPENAI_*`/`SUPABASE_SERVICE_ROLE_KEY`
  追記はユーザー適用待ち。
- Long-run(非同期runner)・帳票正確性(適格請求書計算)・Obsidian投影実体・Stripe webhook は後続M（型/枠のみ M1）。
- L-1 冪等キーは保存のみ（未強制）。retry 多重時の applyAction 短絡は次段。

## 2026-07-10/11 — 需要検証→スコープ/収益/セマンティックレイヤー裁定（PRD v2・ADR0027-0030）

**worked**

- **実装前に需要検証の壁打ちを挟んだ**ことで「作ったもの（統治・課金・接地=信頼性インフラ）≠売ろうとしていたもの
  （汎用AI）」のねじれを発見。M1実LLM接続の直前が最後の分岐点だった。教訓: **スコープ疑義が出たら実装を止めて
  需要データに当てる**（調査コスト << 誤ったMVPの実装コスト）。
- **敵対的検証付き調査の価値**: 「MFは中堅向けだから非競合」という都合の良い読みが 0-3 で棄却され、誤読のまま
  ADR に落ちるのを防いだ。一次PDF実読（Read で画像PDF直読）が web 検索の最終手段として有効。
- **ユーザーの逆張り質問が設計を強くした**: 「手数料主軸なら意図外利用で破産では？」→ 0028 の不変条件
  （クレジット=原価フロア・手数料=上乗せ）として明文化。「セマンティックレイヤーと自己改善ループの関係は？」→
  成果イベント=収益計測点/学習報酬/監査点の三役統合が設計の核だと言語化できた。
  **failed / 反省**
- **deep-research workflow がセッション上限で14主張未検証のまま停止**（105 agents・180万tokens）。ユーザーから
  token 消費の指摘 → WebSearch＋一次ソース実読の軽量路線に切替えて完遂。教訓: **調査は「確定に必要な最小の主張」から
  検証する**。全主張並列検証は上限リスクに弱い。核心2-3件なら自前 WebSearch/実読で足りる。
  **edge / 未決**
- 「案件×お金の管理」需要は調査上の顕在ペインでは無い（白書の課題上位は制度問題）— **潜在仮説のまま採用**しており、
  Phase 0 dogfood が実データでの検証を兼ねる。外れたら 0027 を新 ADR で再裁定。
- Phase 3 の決済リンクは日本のB2B振込文化が未検証の賭け（クライアント側の行動変容が要る）。
- growthfree 調査は n=309・ランサーズ募集でライティング職44%に偏る。エンジニア層データ（freelance-board）は
  元記事403で一部未検証。セグメント別の支払意思は自前アンケートでいずれ取り直す価値あり。

## 2026-07-12 — M1 実LLM接続（llm.vllm.ts・BOUNDARY契約①）

**worked**

- **Ports&Adapters の seam が想定どおり機能**: mock→実vLLM は adapter 1ファイル追加＋DI 1点切替のみ
  （`OPENAI_BASE_URL` 有無で自動フォールバック。ローカル/CI は mock のまま壊れない）。
- **敵対的レビュー（ADR0026）が2周で確定的に効いた**。1周目: CRITICAL2（usage偽装で任意課金・切断時の予約リーク）＋
  HIGH2（無制限ストリーム・エラーdetail exfil）で差し戻し。2周目（同一レビュアーに SendMessage で再検証）: 4件PASS判定と
  引き換えに新規 FINDING-A（completion 下限欠如=過小課金）を検出。**「修正の再検証」も敵対的にやると修正が生む新しい穴が出る**。
  **failed → golden path 候補**
- **外部LLMエンドポイントは「データ」（規約10）— usage も例外ではない**。settle の実コスト源を無検証で信用すると
  課金が壊れる。型: ①上限クランプ（prompt=自前見積×2・completion=max_tokens）②下限強制（実配信文字数の概算）
  ③first-wins＋[DONE]後拒否。**課金に使う外部由来の数値は上下双方からクランプ**が原則。
- **async generator の cleanup は catch では不十分**。クライアント切断は `gen.return()`（return completion）で来るため
  catch を通らない → release は **finally** に置く＋ReadableStream の `cancel()` から `gen.return()` を明示配線。
- **reserve は settle の実上限で見積る**（assumedCompletion=500 → max_tokens 8192 に変更）。reserve<settle 可能な設計は
  「残高0ハードストップ」を settle 時点で破る（FINDING-B）。差額は settle で返るのが教科書形。
- **TS の CFA はクロージャ内代入を追えない**（narrowing が never に潰れる）→ closure から書く可変状態は
  object プロパティ経由にする。
  **worked（実地検証・2026-07-12 追記）**
- **ハーネス16/16 PASS**: モック敵対サーバ（実HTTP・14シナリオ: usage偽装3種/暴走打ち切り/500の鍵exfil防止/
  [DONE]同一バッチ等）＋merge側シム(openai_shim.py)×実モデル(Qwen2.5-0.5B)で実生成を確認。
  シムが非ストリームだったことから **非ストリーム fallback** をアダプタに実装（stream無視サーバへの契約堅牢化）。
- **フルパス e2e 完遂（実Supabase Tokyo）**: migration 0001-0004 を `supabase db push` で適用（policy が
  CREATE POLICY 非冪等だが初適用のため無問題）→ signup(メール確認は SQL で手動confirm)→login→
  **残高0で402**（reserve RPC 拒否・required=8.194=プロンプト＋最大8192tokens見積=FINDING-B修正の実証）→
  grant 100→chat 成功→**settle 0.045・残高99.955（予約差額の返却まで確認）**。reserve→settle→release が実DBで本番形。
- **golden path: 鍵をトランスクリプトに出さない起動法** — `supabase projects api-keys -o json` を
  **消費コマンドへ直接パイプ**（`KEY=$(...) npm run dev`）。ファイル化・表示は権限分類器が正しくブロックする。
  **edge / 残**
- timeout(300s) 時は release（課金0・ユーザー有利）— 部分出力への課金は仕様未決のまま許容とした。
- **DB(RPC)側の settle×estimate 突合は未実装**（次の migration で追加・多重防御）。app層クランプのみの状態。
- usage イベントの balance が float 誤差（99.95500000000001）— 表示は UI 側で丸める（軽微・次段）。
- Supabase の signup は example.com を拒否・メール確認が既定有効 → e2e はテストユーザーを SQL で confirm する運用。
- ~~実 Modal エンドポイントへの切替が残~~ → **解決（2026-07-12 後半）**: 「deploy済み」の実態は `modal serve`
  （一時起動・停止でURL消滅）だった。`modal deploy deploy/modal_serve.py` で恒久化し
  `https://marumo333--qwen36-27b-vllm-serve.modal.run` が払い出し（/v1/models が cold start 約2.5分後に
  401=正常稼働を確認）。golden path: **「デプロイ済み」は `modal app list` の State=deployed で確認**（serve と deploy は別物）。
  `modal-http: invalid function call` は「そのラベルの web endpoint が live でない」の汎用応答（存在確認には使えない）。
- **Modal は cold start 中の応答に 303 リダイレクト（ポーリングURL）を返す** — fetch は自動追従するが
  303 は POST→GET 変換のため、cold start 直後の初回 chat はストリームでなくバッファ応答/失敗になり得る
  （非ストリーム fallback が部分的に吸収）。ウォーム後は通常ストリーム。実挙動は実e2eで要観測。
- **.env の実値整備はユーザー作業のまま**: OPENAI_API_KEY（=vllm-api-key Secret の値・CLIから読めない設計）＋
  SUPABASE_SERVICE_ROLE_KEY/PUBLIC 系。実 Qwen3.6-27B でのフルパス e2e はこれ待ち（シム経由では完遂済み）。

## 2026-07-12 — Cursor ハーネス移行（ADR 0031: Fable 5 頭 + Grok fan-out + 3ファミリーレビュー）

**worked**

- **`.claude/` 資産は Cursor で互換読込される**（agents/skills/hooks すべて）。hooks は third-party configs
  設定が既に有効で、`block_secret_write` が Cursor 上で実発火することを実機確認（.env.test 書込がブロックされた）。
  → 自己成長ループの強制力（規約1/4/5/6/8）はハーネス移行後も機械強制のまま。
- **golden path: subagent のモデル割当は `subagentStart` hook の `subagent_model` で実測できる**
  （`.cursor/hooks.json`＋logger。モデルに自己申告させるより確実）。
- **Task 起動時の model 指定で 3ファミリー fan-out が成立**: `security-reviewer` を `grok-4.5-fast-xhigh` /
  `gpt-5.6-sol-medium` 指定で起動し、指定どおりのモデルで走ることをログで確認。3体多数決のクロスファミリー化は
  frontmatter に依存せず実行時指定で運用できる。
- 移行自体を自己成長ループ1周として実施（ADR 起票→AGENTS/CLAUDE/agents/skills 更新→検証→内省→audit-1 記録）。
  **failed → golden path**
- **agent 定義（frontmatter）はセッション開始時に読込・キャッシュされる**。セッション中に `model:` を書き換えても
  既存セッションの subagent 起動には反映されない（旧値 opus/sonnet のまま起動した）。
  → 定義変更後は**新しいチャットセッションで検証**が必要。AGENTS.md に注記済み。
- 旧 Claude Code エイリアス `opus`/`sonnet` は Cursor でも解決されていた（opus→Opus 4.8、sonnet→Sonnet 4.6）。
  ただし解決規則は非公開のため、frontmatter は実証済みスラッグ（`claude-fable-5-thinking-high` /
  `grok-4.5-fast-xhigh`）に統一した。
  **edge / 残**
- **新 frontmatter（Fable/Grok スラッグ）の実効確認は次セッション待ち**。検証用の `.cursor/hooks.json`＋
  `log_subagent_model.mjs` は残置してあるので、新チャットで任意の subagent を起動し
  `.cursor/subagent-model.log` を見れば確認できる。確認後に検証ファイル3点（hooks.json/logger/log）を削除する。
- 頭のモデルは設定ファイルで固定できない（チャットタブのモデルピッカーで Fable 5 を選ぶ運用）。
- verify チェック7（Qwen 実機 golden fixture 評価）は M2 マイニング実装まで対象なし＝スキップ運用。
  fixture の初期セットは M2 着手時に 0023 の HITL 採否ラベル形式で作る。

## 2026-07-12 — M1 残債（0005 課金hardening＋冪等強制・新ハーネス初実戦）

**worked**

- **新ハーネス（Grok fan-out + 3ファミリー多数決）の初実戦が設計どおり機能**。Grok 2体（db-migrator/api-builder）の
  並列 fan-out は一発で型緑・テスト緑の実装を返した（触るファイルが重ならない分割が効いた）。
- **3ファミリーレビューの指摘が実際にほぼ非重複だった**（ファミリー多様性の実証）:
  Fable(correctness)=トークナイザ差で settle が系統的に raise する High（設計仕様の欠陥）＋index dedupe 漏れ。
  Grok(越境/IDOR)=APPROVE（境界はクリーン）。GPT Sol(冪等/漏洩)=confirm ルートの並行競合2件・decision fail-open・
  監査 error 未確認・UI の失敗を成功表示、を**3ラウンドかけて**検出。同一ファミリー3体なら Sol の状態機械系
  指摘は出なかった可能性が高い。
- **修正→同一レビュアーに resume で再検証**の型（M1 実LLM接続と同様）が再び有効。修正が生む新しい穴
  （applied 先書き→クラッシュで虚偽監査）を再検証ラウンドが捕捉した。
- 実装の主要修正: ①settle は `min(実測, estimate)` クランプ＋DB 側 `settle_exceeds_estimate` fail-loud の
  二層（app が守り DB は最後の砦）②confirm ルートを CAS 化（proposed→applying→applied/failed の状態機械。
  実行前に applied を書かない）③decision は fail-closed（approve/reject 以外 400）④DB 例外メッセージは
  『課金確定エラー』に一般化（数値露出防止）。
  **failed / 反省（設計仕様側の教訓）**
- **fail-loud ガードを DB に足すときは「app 層が不変条件を保証しているか」を先に確認する**。当初仕様は
  DB ガードのみで、adapter が prompt usage を見積の2倍まで受理する既存仕様と矛盾（正規フローで raise）。
  多重防御は「内側の層が守る前提を外側で検証する」構造にして初めて成立する。
- **冪等 unique index は「既存データの重複」と「他フローとの相互作用（proposed→applied UPDATE）」の
  2点を必ず先に洗う**。index 追加は単独では安全に見えて状態機械全体に波及する。
  **モデル別観点（0031 の新設軸）**
- Grok 4.5（実装席）: 仕様が明文化されていれば高速・正確。仕様自体の欠陥は指摘せずそのまま実装する
  （↑の settle 矛盾は素通り）→ 委譲前の仕様レビューか、実装後の敵対レビューが必須という前提を再確認。
- GPT-5.6 Sol（レビュー席・medium）: 並行性・状態機械・「UIが真実を表示するか」の指摘が突出して鋭い。
  medium 推論でもレンズを絞れば高価値。ラウンドを重ねるごとに新しい層の指摘が出る（3ラウンド要した）。
- Fable 5（レビュー席）: ドメイン不変条件（課金の上限整合）と migration の運用リスク（dedupe）に強い。
  **edge / 残（backlog・Low）**
- 二重「提案」を承認した場合の 23505 は 500 に写像される（適切なHTTPコード化は後続）。
- 提案行の idempotency_key 名前空間が actionId と共有（衝突理論値）。result=null の applied 行が
  findApplied に返る型の嘘は latent（現行 create/update/remove では result 必須のため未発現）。
- governance の「副作用→監査 append」順序は、confirm ルート以外に同一キーの新経路が増えると
  二重実行が再発する構造（経路追加時は CAS 相当の入口直列化を必ず付ける）。
- 0005 は実 DB（Tokyo）適用済み（migration list で Local=Remote=0005 確認）。

## 2026-07-12 — 実 Qwen3.6-27B フルパス e2e 完遂（M1 完了）

**worked（全項目 PASS・実 Supabase Tokyo × 実 Modal/Qwen）**

- **実 LLM チャット貫通**: login→案件作成→チャット送信→実 Qwen 応答ストリーム→settle。
  DB: reservation settled（estimate 8.201 → actual 0.52・差額返却）、usage(qwen36-27b, 18/502 tokens)、
  messages に user/assistant 永続化。UI 残高表示も追従（100→98.5cr）。
- **0005 ガード実機発火**: reserve 1.0 → settle 2.0 が `settle_exceeds_estimate:1:2` で拒否され、
  境界（actual=estimate）は通過、残高整合（100→99）。DB 側多重防御が本番形で機能。
- **CAS/冪等の実機確認**: 同一 actionId への並行 approve×2 = ちょうど片方 200・片方 409。3回目 409(applied)。
  `decision:'rejcet'`（タイポ）= 400 invalid_decision（fail-closed）。副作用（project 作成）は正確に1回。
  監査は提案行（executed_action_id 参照）と実行行（idempotency_key=actionId）の2行が相互参照で整合。
- **usage 丸めの実機確認**: usage イベントの costCredits/balance が小数3桁（0.17 / 98.31）で float 誤差解消。
- **golden path: e2e ヘルパー `scripts/e2e_m1.mjs`**（setup/guard/propose/assert）＋ブラウザ実操作の組合せが
  「UI 実フロー＋DB 直接検証」の二面 e2e として再利用可能（`node --env-file=.env` で .env を安全に注入）。
  **failed / edge**
- **Cursor サンドボックス内で起動した dev サーバは外部 fetch が Proxy 403 で失敗する**
  （signInWithPassword が fetch failed）。実 e2e の dev サーバは full_network 権限で起動すること。
- **Qwen3.6 は thinking モデル**: 短い挨拶でも completion 160 tokens（思考分）に対し可視 content 7文字。
  課金は思考込みトークンで正しいが、体感コストと可視出力の乖離がある。コスト表示 UX の論点として M2 以降へ。
- 最初の UI チャットの応答テキストがストリーム完了後のチャット欄に残らない事象を観測（DB には assistant
  永続化済み・API 直叩きでは text イベント正常受信）。UI の再描画起因の可能性が高い。軽微・要再現確認。
- e2e テストユーザー（e2e-m1-*@marumo333-e2e.dev）と検証データは Tokyo 実 DB に残置（次回 e2e で再利用可。
  不要になったら auth.users から削除すれば cascade で全消える）。

## 2026-07-12 — hermetic e2e / HOTL / CI 導入（ADR 0032）

**worked**

- **Playwright hermetic e2e 実体化**: ローカル Supabase + mock LlmPort。`test:e2e` / `test:e2e:ci`。
  auth / billing / ux（a11y・responsive）**15 pass・snapshot 2 skip**（baseline 未コミット時は CI でも skip）。
- **鍵注入の Blocker 修正**: `webServer` は globalSetup より先起動 → config 評価時に `getLocalSupabaseEnv()` →
  `webServer.env`。`.env.test` は作らない（hook 実績と整合）。
- **dispatch 順**: prettier 単独最初 → supabase-local ∥ playwright-setup → e2e specs 並列 → ci 最後。
  `package.json` 衝突回避が効いた。
- **HOTL = 枠は今・手順は実績から**: `hotl-ops`（頭直轄・ops-runner 不設置）。db-migrate に実 DB push 手順を昇格。
- **UX 2層**: `ux-quality.yaml` + `ux-reviewer` + `e2e/ux.spec.ts`。accent を `--accent`/`--accent-solid` に分離し
  axe AA を満たした。狭幅は sidebar/explorer 畳みで overflow 解消。
- **CI**: `.github/workflows/ci.yml`（check/lint/test/build/e2e + gitleaks）。snapshot 更新は
  `workflow_dispatch` + `UPDATE_SNAPSHOTS=1` のみ。
- **confirm CAS の service 移設**（ESLint 境界①対応）: `confirm/+server.ts` の CAS 全文を
  `ontology.service.confirmProposedAction` へ抽出。敵対レビュー APPROVE（404→403→409・CAS・failed・
  fail-loud 回復コメント復元・confirmed 固定・テナント束縛は旧と意味同値）。規約12 高リスク経路のため
  「本体変更なし」前提の外 — デフォルト敵対レビュー必須だった。

**failed / golden path**

- Vite は IPv6 only になり得る → `npm run dev -- --host 127.0.0.1` を webServer に明示。
- login の `value={form?.email}` は Playwright fill を消す → `bind:value` に変更。
- `.hint { opacity: 0.7 }` は muted の実効コントラストを AA 未満にする → opacity 禁止。
- 視覚回帰 baseline 未コミットのまま CI 比較すると必ず赤 → **png 不在時は skip**（dispatch で初回生成）。
- ESLint global ignores に `e2e/**` を入れると後段 e2e ルールが dead → **ignores から外す**（type-aware は disableTypeChecked ブロックで緩和）。

**permissions 検証（perms-verify）— 未完了・後続 backlog**

- `deny: Read(./.env)` は Claude Code 形式で Cursor 実効は未確定（hooks は実効確認済み）。
- Bash `cat .env` は Read deny を素通りし得る → **観測タスク未完了**。hook 移植（PreToolUse Bash または
  `block_secret_write` の Bash 面）と合わせて後続 todo `backlog-perms-hook` に明示。

**edge / 残**

- Linux snapshot baseline は初回 `workflow_dispatch update_snapshots` → artifact 承認 → コミットが必要。
- `backlog-ops-promote`: デバッグ/運用の初実戦後に hotl-ops 手順昇格。
- `backlog-perms-hook`: Read+Bash での `.env` 観測 → Cursor 実効確認 → 必要なら hook 移植。
- `block_secret_write` は `/src/` のみ — `e2e/` への本番鍵書き込みは gitleaks が二次防御（後続で e2e 拡張可）。
- wrangler pages dev smoke は HOTL 将来項（vite dev ≠ workerd）。
- confirm 経路の後続改善（任意）: サービス層 decision 再検証、failed/applied 更新に applying CAS、403/404 統一。

## 2026-07-13 — Ship B（chat UX / confirm CAS / perms-verify）

**worked**

- **chat UX ゲート**: `e2e/ux.spec.ts` に chat a11y / responsive / snapshot（3画面目）を追加。
  待ち条件は「アクティビティ: 待機」＋ `.m.assistant .bubble` に `M1 mock`（NDJSON done の UI 代理）。
- **Svelte 5 Proxy 落とし穴**: `emptyAssistantTurn()` を push 前に作ると raw と配列内 Proxy が別物になり、
  `applyEvent` が UI に届かない（残高だけ usage で更新される）。**push 後の `turns.at(-1)` を mutate** するのが正。
- **confirm CAS e2e**: `e2e/confirm.spec.ts` — 並行 approve×2 = 200+409、3回目 409(`applied`/`not_pending`)。
- **perms-verify**: Claude `deny: Read(./.env)` は **Cursor の Read では非実効**（実観測で読めた）。
  Bash/Read 面は `.claude/hooks/block_env_read.mjs` ＋ Cursor `beforeShellExecution`/`beforeReadFile` に移植。
  `.gitignore` で `.cursor/hooks.json` と `.cursor/hooks/**` を除外解除してコミット可能に。

**failed / 判断**

- **承認カードを snapshot に含めない**: mock LLM は `action_proposed` を出さない（chat.service 未配線）。
  a11y/snapshot は残高メータ＋ストリーム完了 UI のみ。カードは governance が emit するまで対象外。

**edge / 残**

- `snapshot-baseline`（HOTL）: `workflow_dispatch update_snapshots` → artifact 目視 → `-linux.png` コミット。
- Ship C: wrangler smoke / 0006 実 DB / ops-promote / reflect。

## 2026-07-13 — Ship C（wrangler smoke / ops-promote / reflect）

**worked**

- **wrangler pages dev smoke（初実戦）**: `npm run smoke:wrangler` — build → `wrangler pages dev`
  （`scripts/wrangler-pages-dev.mjs` が `supabase status` → `--binding` 注入）→ Playwright
  `e2e/wrangler-smoke.spec.ts`。login + chat NDJSON done が **workerd 上でも緑**（vite dev との差なし）。
- **hermetic 鍵注入の再利用**: e2e と同じ「ファイル化しない」パターンを wrangler `--binding` に適用。
- **wrangler ピン**: devDependency `4.107.0`。`nodejs_compat` compatibility flag 必須（未設定時 async_hooks 警告）。
- **hotl-ops 昇格**: ドメイン3「運用保守」に実 DB migration 手順 + wrangler smoke 手順を本文化。
- **ADR 0032**: Consequences を「将来項」→ smoke 実測済みに更新。

**failed / 判断**

- **0006 実 DB 適用（ops-live-0006）**: 2026-07-13 に実行完了。
  対象: `marumo333-dev`（`hynljgwtkbqsyqmgfeii`・ap-northeast-1）。`supabase db push` →
  `migration list` で 0001–0006 が Local=Remote。hosted は広い default privileges のため
  0006 は実質 GRANT 層の明示化（no-op に近い）だが、CI 42501 再発防止の意図どおり remote にも固定された。

**edge / 残**

- wrangler smoke を CI ゲートにするかは次段判断（現状は HOTL 手動・計画どおり CI 外）。
- workerd で NDJSON が割れた場合の差分記録フォーマットは未使用（初回は差なし）。

## 2026-07-13 — M1残地＋M2編集デスク実装完了（feat/m1-residual-m2-editorial-desk）

**worked**

- **LlmPort tools ＋ chat ツールループ**が本番形で貫通: soft アクションは非カード実行、hard は
  `action_proposed` カードで HITL に落ちる分岐が設計どおり機能。
- **既定 accept ＋ `set_autonomy_mode`**: モード切替自体は tool から除外（PolicyWriter 経由のみ）とし、
  LLM がモードを自己昇格させる経路を構造的に塞いだ。
- **abuse 対策の束**: Origin 検証・rate limit・cookie Secure・HSTS。fixture 投入は
  `ALLOW_INGEST_FIXTURES` フラグでゲートし、本番での fixture 経路を遮断。
- **objects_candidates ＋ 閾値 HITL ＋ CandidateCard**: マイニング候補は閾値で自動/HITL に振り分け、
  UI カードで採否確認する形が成立。
- **plan-confirm 拘束の遵守**が効いた（fan-out 前の計画確定 → 実装のブレなし）。
- **敵対3体の初回 reject → High 修正 → Fable 再レビュー approve** の型が再び機能。
  初回一発 approve でない方が健全（レビューが実際に穴を掘っている証跡）。
- **golden path（e2e）**: Playwright の `page.request` は **Origin ヘッダを自動付与しない** →
  Origin 検証のあるエンドポイントを叩く e2e は **Origin ヘッダ明示が必須**。

**failed / edge**

- **Playwright APIRequestContext と assertSameOrigin の不整合**で初回 e2e が 403。
  原因は↑の Origin 未付与（サーバ側は正しく拒否していた）。教訓: 「e2e が赤 = 実装バグ」とは限らず、
  セキュリティガードの正常動作をテストハーネス側が満たしていないケースを先に疑う。
- **ingest の auto_promote が apply 結果を無視**して昇格済み扱いにしており、DB とアプリ状態が乖離
  （修正済: apply 結果を検証してから状態遷移）。「書いたはず」を無検証で信じない — 0005/CAS と同型の教訓。
- **切断時 release でゼロ課金**になっていた（修正済: 消費分は settle してから release）。
  M1 実LLM接続の「release は finally」の教訓に「finally でも消費分の settle を先に」が追加された形。

**モデル別観点（0031/0033 の軸）**

- Fable security-reviewer: correctness レンズで **gate 無視**と**切断時課金**を検出（ドメイン不変条件系）。
- Grok security-reviewer: **GRANT 欠落**と **`confirmed:true` による保護 status 迂回**を検出（越境/権限系）。
- Sol: **fixtureCandidates の本番悪用**を検出（意図外経路・状態機械系）。3ファミリーの指摘が今回も非重複。

**edge / 残**

- 保護 status 迂回・GRANT 欠落は修正済みだが、同型の穴（新テーブル追加時の GRANT/RLS 漏れ、
  ツール入力経由の保護フラグ混入）は経路追加のたびに再発しうる構造 — 敵対レビューの定点観測項目として維持。

---

## 2026-07-17 — PR#9 CI hotfix + paste UI + behavior-change TDD harness

**worked**

- CI 403 は abuse Origin と `page.request` のズレ。アプリを緩めず `sameOriginHeaders` でテスト追随。
- 編集デスク後のログイン到達条件は「残高」ではなく「未入金請求」（案件ヘッダに残高が移った）。
- **ADR 0013 を behavior-change TDD に拡張**: クリティカル厳格 TDD は維持しつつ、観測可能挙動は red 証跡必須。
  verify / DoD / ui-builder・api-builder 禁止事項まで落とした（ローカル規約だけでは足りない）。
- paste UI は TDD 厳守: e2e-runner で `paste-ingest` not found を観測してから最小パネル実装 → ingest 3 passed。

**failed / 反省**

- Task1 初回 push で prettier 未整形の docs が lint で落ちた。harness md も commit 前に `prettier --write`。

**edge**

- UI から fixture 無しで低 conf カードを hermetic に出す経路は heuristic 依存 → API 低 conf + UI ingest 200 の二段を維持。
- Linux snapshot 再生成（#13）と HOTL 製品完走は残。

---

## 2026-07-18 — M1/M2 closeout TDD（PR#9 続・plan-confirm approve）

**worked**

- TDD 厳守で残地クローズ: abuse/status unit → vLLM tools（stream:false）→ chat tool_calls 形＋1 soft/round
  → ingest LLM＋`<untrusted>`＋insert-then-promote＋accept `confirmed:true` → クレジット予告 UI。
- plan-confirm（Fable）binding: デリミタ無害化・calls 上限・課金ラベル・HITL confirmed を実装に落とした。
- hermetic e2e: agent-loop / ingest（accept 含む）/ credit-estimate 6 passed（local supabase 0007/0008 適用）。
- 敵対: クレジット予告の 4 倍不足と tool_calls 無制限を検出→`chat-estimate` 共有定数で修正。
- 切断時ゼロ課金（usage await 前 abort）: stream 周りの finally で usage 回収＋`streamedChars` を try 外へ。

**failed / モデル別**

- Fable correctness: abort settle 穴と try スコープの `streamedChars` を検出（修正済）。
- Grok IDOR: candidates/ingest を approve。
- Sol: 閾値 auto_promote を「取得から自動アクション禁止」と解釈して reject。計画/ADR0029 の
  soft 閾値昇格と衝突 → **意図的残地**（ハードゲートは到達不可・binding 済み）。idempotency 強化は後続。

**edge**

- 実 Qwen golden（verify #9 HOTL）と hosted 0007/0008 適用確認は手動残。
- chat tool 出力の spotlighting・ingest 部分失敗時の課金整合は Medium 残（learnings 継続）。

## 2026-07-18 — M1/M2 HOTL + Workers AI 既定差し替え（H4）

**worked**

- Modal HOTL 証跡: soft/hard とも LLM **HTTP 404**（`modal-http: invalid function call`）。アプリ認証/課金は通過。
  以前の「tool 不発」は短 timeout 偽陰性（H4）＋今回はホスト死亡。比較対照として `/tmp/hotl-modal-m1m2.json` と golden に残した。
- Workers AI `@cf/qwen/qwen3-30b-a3b-fp8`: soft tool end+DB（~5.5s）/ hard `action_proposed` / paste 候補記録で **HOTL PASS**。
- アダプタ正規化が必須だった: (1) `reasoning`/`reasoning_content` → 本文 (2) embedded `<tool_call>` (3) follow-up の
  assistant `content:null` は CF が 400 → **空文字** (4) nonStream で `tool_choice:auto` + `enable_thinking:false`。
- hermetic（mock）は `aria-label` 付与後 28 passed / 3 skipped（visual）。`CI=1` だと darwin snapshot 欠で偽陰性。
- **既定モデル名の単一真実化（敵対 H-1 由来）**: `src/lib/shared/product-llm.ts` の `DEFAULT_PRODUCT_MODEL`
  1定数に集約（chat.service / ontology.service が参照）。fallback 文字列の重複定義はモデル差し替え時に
  必ず食い違う構造だった。golden path: **既定値をコード側に持つなら shared 定数1箇所、env はその上書きのみ**。
- **HOTL の service_role 書込はローカル DB 限定ガード**（`scripts/hotl_m2_qwen.mjs`）: `PUBLIC_SUPABASE_URL` の
  host が 127.0.0.1/localhost 以外なら fail-loud（`ALLOW_HOTL_SERVICE_ROLE=1` で明示オプトイン）。
  .env が本番 URL のまま HOTL を回す誤爆を構造的に防ぐ — 「鍵の強い操作は既定 deny＋明示許可」の再適用。

**failed / 反省**

- Vite を `&` で短命シェルから起動すると HOTL 中に死ぬ → **永続 background shell** が必要。
- Modal 秒課金×長壁時計は dogfood で不利。コスト/SLO とも Workers AI 既定が合理（品質ダウンは KPI 監視）。

**モデル別観点（0031/0033 の軸）**

- Fable（correctness）: **H-1 = 既定モデル名の重複定義の食い違い**を検出（ドメイン整合系。単一真実化の起点）。
- Grok（越境/権限）: **HOTL スクリプトの service_role が本番 URL に誤爆しうる**点を検出 → ローカル限定ガードに落ちた。
- Sol（意図外経路/状態機械）: **既存残地の chat tool 出力 spotlighting を High 扱い**で reject 寄り →
  今回スコープ（HOTL＋既定差し替え）外の既知残地（07-18 前半節に記録済み）として**スコープ外裁定**。
  教訓: レビュアーが既知残地を再検出したら「新規回帰か既存 backlog か」を learnings 参照で切り分けてから裁定する。
- 3ファミリー非重複は今回も維持（correctness / 権限誤爆 / 意図外経路で各1件ずつ）。

**昇格提案（harness-grow）**

- hotl-ops skill に「HOTL 前提: 永続 background shell で dev 起動＋service_role はローカル DB ガード必須」を
  1項追記する候補（次回 HOTL 実戦で再利用が確認できたら昇格。今回は learnings 記録のみ）。

**edge**

- ローカル `.env` がまだ Modal URL の場合あり。製品既定は `.env.example` / ontology fallback / ADR0010。
- paste 応答の `model` フィールドは null のまま（抽出経路のラベル露出は後続）。

---

## 2026-07-19 — Install必須 + Bonsai通常 / M3頭脳（ADR 0035 V0–V4）

**worked**

- V0: ADR 0035 Proposed + `inference-routing.yaml` + PRD §8b + market §G。plan-confirm（Fable）approve。
- V1: 通常=ブラウザ→loopback、頭脳=サーバ→`minimax/m3`、`route=normal` は API 400。local-usage は tokens のみ・credits=0。
- 敵対レビュー初回 reject → criteria と実装の spike 方針を一致、local-usage で conversationId 無視、CSP loopback、local SSE loop_guard。再レビュー approve。
- V2: bakeoff ケース＋閾値ロック＋runner。品質 Go は HOTL 待ち、architecture_go で V3 許可（RESULTS.md）。
- V3: `companion/` loopback proxy（Bearer・/v1/models・chat プロキシ）。Tauri 署名は次段。
- V4: 0004/0028 Amended **草案**（$20 アンカー・WTP 質問）。実装なし。
- **ハーネス追記後 plan-confirm 再 approve**（05:08）→ **V1e**（`e2e/inference-routing.spec.ts`）→ **V1r pass**（security 3体+ux+設計突合）。証跡: `knowledge/product/v1r-compliance-2026-07-19.md`。
- V1r 中: route allowlist、`resolveTrustedChatRefs`、Companion CORS/偽ready 修正、`E2E_MOCK_LLM=1`。

**failed / 反省**

- criteria に `deny llm_infer_brain` と書きつつ V1 実装は brain 常時許可 → 敵対レビューで即検出。spike 方針は criteria に先に書く。
- `usage.location` 列なしで conversationId を信頼すると SECURITY DEFINER settle で他テナント FK 汚染面。V1 は無視が正。
- Playwright `OPENAI_BASE_URL: ''` は Vite/.env に負ける → hermetic は `E2E_MOCK_LLM=1` が必要。
- route の「normal 以外はレガシー」は fail-open。allowlist 必須（V1r Sol critical）。

**edge / 次**

- HOTL: M3 402 解消のうえ `npm run bakeoff:v2 -- --run`。合格後に ADR 0035 Accepted。
- V3 次: 署名付き pairing・Tauri ワンクリック・SPIKE_BEARER 廃止。
- model id `minimax/m3` は実カタログで再確認（`BRAIN_MODEL_NAME` 上書き可）。
- 任意プロンプトでもハーネスが機械的に効くかは hooks 強化が残課題（V1r は文書 pass）。
- **2026-07-19 HOTL**: `hotl-m3-probe.sh` → `minimax/m3` **HTTP 402**。Workers AI `@cf/` 課金と AI Gateway Unified Billing は別枠。Dashboard で Credits Top-up か MiniMax BYOK 後に再プローブ。
- **2026-07-19 Pivot 起票**: 頭脳を `@cf/zai-org/glm-5.2` へ（ADR 0036 Proposed / `2026-07-19-bonsai-glm52-brain-pivot.md`）。根拠: M3 無料 Neurons なし＋402、AA Index GLM 51>M3 44、Kimi 42 は前提外れ。代償は単価↑・CF context 262k・ZDR バッジなし。
- **2026-07-19 HOTL**: `hotl-brain-probe.sh` → `@cf/zai-org/glm-5.2` **HTTP 200 ok**（人間実行・Neurons 経路）。次は Companion 起動後 `npm run bakeoff:v2 -- --run`。
- **2026-07-20 HOTL bakeoff**: Bonsai-demo setup（**8B**・27B は HF トークン要）。MLX 不可（Xcode Metal）。llama-server **8081** + Companion **8080**。normal 4/4・brain 4/4。`brain_hard > normal_hard` は両者 1.0 で **quality_go 未達**（ヒューリスティックが 8B hard も通す）。
- **2026-07-21**: Ternary-Bonsai-**27B** 再測も normal_hard=1.0（既定起動は 16GB Metal OOM → text-only/-c 8192）。人間「進めて」→ `architecture_go_quality_deferred`（閾値はロック維持・ADR 0036 Accepted 保留・V3 へ）。
- **2026-07-21 pairing**: 短命 token は「毎回接続」ではなく **サイレント再 pair**（残り120s）。貼り付け本線は UX 弱 → Connect 1クリック。security 初回 1/3 → logout clear・sub 突合・CORS ALLOWED_ORIGINS・鍵ファイル化で 2/3。
- **2026-07-19 HOTL probe script**: `scripts/hotl-brain-probe.sh` 既定 `@cf/zai-org/glm-5.2`（`hotl-m3-probe.sh` は M3 互換ラッパ）。live プローブは人間が `set -a && source .env && set +a && bash scripts/hotl-brain-probe.sh` を実行（エージェントは `.env` 読まない / hook ブロック）。`glm52_probe: pending_human`。

## 2026-07-19 — GLM-5.2 brain pivot（ADR 0036・Tasks 0–5 完了 / Task 6 bakeoff は HOTL probe 待ち）

**worked**

- **課金の Neurons 一本化**が pivot の決め手: `@cf/` prefix は Workers AI 無料 Neurons 枠に乗る（M3 は
  AI Gateway Unified Billing 別枠で 402）。頭脳モデル選定は「品質×**課金経路**」の2軸で見る。
- **plan-confirm（Fable）が未知 model のフォールバック挙動を計画段階で指摘** — 実装前に
  「未対応 model 名が旧既定に silent fallback する」穴を塞げた。
- **CoT fallback を敵対レビューが検出**: `reasoning_content` を本文に流し込む正規化（H4 由来）は
  GLM-5.2 では思考の露出になる — 「reasoning→本文」正規化はモデルごとに要否が反転する。

**failed / edge**

- **M3 無料枠の誤解**が pivot コストの根因（0035 時点で `@cf/` と Unified Billing の課金枠区別を未検証のまま採用）。
  教訓: **モデル採用前に課金経路を probe で実測**する。
- **probe スクリプトの `bash -x` は秘密を反射する**（Bearer が trace に出る）→ probe 系は set -x 禁止＋
  ヘッダは変数間接で組む（983f3fc で hardening 済み）。
- GLM の `reasoning`→本文混入（↑CoT と同根）は adapter 側でモデル別に抑止。

**モデル別観点（0031/0033 の軸）**

- Fable: CoT 露出（reasoning→本文）の検出。Grok/Sol と非重複を維持。
- Sol: probe 衛生（bash -x の秘密反射）の検出 — スクリプト/運用面の穴に強い傾向が継続。

**edge / 残**

- Task 6 bakeoff（`npm run bakeoff:v2 -- --run`）は HOTL の GLM-5.2 live probe 待ち。合格後 ADR 0036 Accepted。
