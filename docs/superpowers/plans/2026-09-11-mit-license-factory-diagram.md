# MIT ライセンスと工場 mermaid Implementation Plan

> **For agentic workers:** 親 Grok が単独実装する。並列展開しないため plan-confirm は省略。

**Goal:** MIT ライセンスを発行し、README の既存 PNG 図式を本ハーネスのソフトウェア工場 mermaid に刷新する。

**Architecture:** LICENSE は 0044 のアイデンティティ（Copyright (c) 2026 marumo333）を実行する。README の正は mermaid（席・正本・ゲート・cycle・packet・code-mode）。旧 PNG は docs/architecture/ に履歴として残す。適用は F-0001。F-0011 は proposed のまま入場しない。0044 決定本文は消さない。

**Tech Stack:** MIT 条文、GitHub mermaid、`node --test`、OPA feature-gate

## Global Constraints

- コミットは conventional prefix + 日本語主語。`--no-verify` 禁止。
- 新 Feature を同一 PR で admitted / approved にしない。
- Sol を現行第3に戻さない。現行ピンは Fable / Muse / packet / code-mode。
- Uber Gateway・艦隊・Context Graph は作らない。
- tdd_exceptions: 文書本体は docs_only。LICENSE / package.json.license / README mermaid ロックはテストで固定する。

---

## Task 1: ロックテスト

- [ ] `scripts/license-readme.test.mjs` を追加し、LICENSE・`package.json` の license・README mermaid / PNG 非参照を固定する
- [ ] `package.json` の test スクリプトにファイルを足す

## Task 2: 発行と図の刷新

- [ ] ルートに MIT `LICENSE` を置く
- [ ] `package.json` に `"license": "MIT"`
- [ ] README アーキテクチャ節を mermaid に置換し、ライセンス行を足す
- [ ] TEMPLATE に MIT 1行を足す
- [ ] F-0011 を proposed で起票する
- [ ] `node scripts/knowledge-catalog.mjs --write`
