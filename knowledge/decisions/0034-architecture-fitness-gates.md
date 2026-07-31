# ADR 0034: アーキテクチャ fitness ゲート（A+B+C）

- Status: Accepted
- Date: 2026-07-13
- Context: セキュリティ/課金ゲートは厚いが、連続 AI 実装による FSD/Ports 侵食・層崩れの継続ゲートが薄い。
  席ルーティング（[[0033]]）だけでは構造ドリフトを止められない。専用 arch-reviewer agent の新設は
  ロースター肥大化のため避ける。
- Decision: **A+B+C** を DoD / skill に載せる。
  - **A（機械）**: `npm run arch:fitness`（`scripts/arch-fitness.mjs`）。最低限:
    1. クライアント（`*.svelte` / 非 `.server` の `+page.ts`/`+layout.ts` / `lib` のうち server 外）から
       `$lib/server` および相対パスでの `lib/server` 参照禁止（静的 `from` / 動的 `import()`）。
    2. `src/routes/**` および `src/hooks.server.ts` から `$lib/server/adapters/**` 直 import 禁止
       （services / errors / ports 型は可）。
    3. `@supabase/supabase-js` の `createClient`（別名 import・呼び出し含む）および
       `new Stripe` / `new OpenAI` は `src/lib/server/adapters/**` 以外禁止（型 import は可）。
    4. **`@supabase/ssr` の `createBrowserClient` / `createServerClient` は composition root のみ許可**:
       `src/hooks.server.ts` と `src/routes/+layout.ts`（SvelteKit 認証配線）。それ以外での SSR クライアント
       生成は fail。learnings の「SDK 全部 adapters」は過大表現で、本例外が正。
       意図的例外はファイル先頭の `// arch-fitness-allow: <reason>` 1行のみ（濫用禁止）。
  - **B（意味）**: `adversarial-review` に **architecture レンズ**を必須節として追加
    （FSD 依存方向・Ports 貫通・ADR 矛盾）。単独 arch-reviewer agent は作らない。
  - **C（入口）**: 新 Port / 新テーブル・RLS / 横断 feature / 機微 API 契約変更は
    `backend-architect` Task 必須。`plan-confirm` と同一起動に統合可。未実施なら fan-out 不可。
  - **D/E/F**（audit 構造スコア・インシデント ADR 強制・週次バッチ）は今はやらない（次候補）。
  - **既知の非目標（機械ゲートの限界）**:
    1. 別ファイル再 export 経由の `createClient` 完全追跡はしない（同一ファイルの import 束縛まで）。
    2. 先頭 `// arch-fitness-allow:` はファイル全体スキップ（濫用はレビューで落とす）。
    3. `pre_commit` 未強制 — `verify` / DoD / ローカル実行が一次（飛ばしうる）。
- Consequences: 層違反は機械で止まり、意味的侵食は敵対レビュー、設計スキップは入口で止まる。
  `verify` / [[0016]] が A を参照する。`$lib`・相対パス・動的 `import()` の `lib/server` 参照は検出する。
- Links: [[0002-fsd-frontend]] [[0003-layered-ports]] [[0016-definition-of-done]]
  [[0031-model-strategy-cursor-multi-family]] [[0033-harness-api-budget-routing]]
