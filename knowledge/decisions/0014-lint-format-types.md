# ADR 0014: lint / format / 型厳格度

- Status: Accepted
- Date: 2026-07-04
- Context: 一貫したスタイルと型安全を自動強制し、レビュー負荷とバグを減らす。
- Decision:
  - **TypeScript strict**（`strict: true`、`moduleResolution: bundler`）。`src/lib/server` と `domain` では
    `any` 禁止（境界の外部データは zod 等で検証してから型付け）。
  - **ESLint + Prettier + svelte-check**。コミット前に `npm run check`（型）＋ lint を通す（[[0016-definition-of-done]]）。
  - `PUBLIC_` 以外の env をクライアントバンドルに出さない（lint/hook で検知・[[0015-errors-naming]] と併せる）。
- Consequences: 初期セットアップコストはあるが、以後の一貫性と安全性で回収。CI/hook でゲート。
- Links: [[0016-definition-of-done]] [[0015-errors-naming]]
