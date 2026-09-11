# 監査と token効率化の用語 Implementation Plan

> **For agentic workers:** 親 Grok が単独実装する。並列展開しないため plan-confirm は省略。

**Goal:** README の工場比喻を監査 / token効率化と席語彙へ置き、テストで旧語の再混入を止める。

**Architecture:** ラベルと導入文だけを替える。mermaid ID と cycle 辺、禁止辺、MIT LICENSE は触らない。適用は F-0001。F-0011 はタイトルと問題文だけ更新し proposed のまま。

**Tech Stack:** README mermaid、`node --test`、knowledge-catalog、OPA feature-gate

## Global Constraints

- コミットは conventional prefix + 日本語主語。`--no-verify` 禁止。
- 新 Feature を同一 PR で admitted / approved にしない。
- 工場長 / 治具 / ソフトウェア工場 / 工場フロア / 抜き取り / 工程カード / 正本倉庫 / 出荷 / 原料 を README に残さない。
- Uber 工場（0044 設計の棄却項）は消さない。
- tdd_exceptions: 文書本体は docs_only。ロックテストの期待値変更は赤を先に観測する。

---

### Task 1: ロックテストを新用語へ

**Files:**
- Modify: `scripts/license-readme.test.mjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: README / F-0011 / catalog を最小更新**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
