# ディスパッチ packet（context_mode と親の effort 上書き）— 2026-09-10

親から子へ会話を継がず、リポに落ちた事実だけを型付き JSON で渡す。
effort / escalate は親だけが書いてよいノード属性。形の正本は Rego。

## 問い

1. LangChain の isolated / fork を、このハーネスの席にどう写すか。
2. Astra の「親が子ノードの effort を変える」を、固定席と両立させるか。
3. packet の型は TypeScript か、既存の Rego か。

## 調査結論

NO1ennn（Graph / Loop / Harness）は、296 体はプール容量であり、グラフを人間が持つと書く。
Rosen はジャッジをループに入れるなら分解・比較・決定的包囲が先と書く。
LangChain deepagents は子の context mode を isolated / fork に分け、Verifier は isolated、Worker は fork とする。
Grok 4.6 カード §5 は評価ハーネスへの自己貢献を測るが、InferenceEval は検証をループから外す。

このハーネスはゲートを既に isolated にしている（ADR 0031 / 0033）。欠けているのは Worker の継承単位と、親の effort 上書き API である。
LangChain の会話 fork をそのまま載せるのは [[0033]] / [[0044]] と衝突する。写すのは **名前付き成果物の継承** である。

TypeScript の型は実行時に消える。子が読むのは JSON。0014 は空の型ゲートを置かない。0043 は形の正本を Rego とし、Pydantic を入れない。

## 方針（3案）

### A. context_mode + 親上書きを packet に載せる（採用）

`isolated` / `packet` をノードに宣言する。会話 fork は置かない。
親は dispatch レコードに `effort` / `escalate` を書いてよい。Rego が許容幅を見る。子が同じキーを返しても無視または deny。

- 利点: 三記事と 0044 の code_mode が一つの機械契約になる。
- 欠点: Feature + skill + Rego + CLI が必要。

### B. 空成功と token_ledger だけ先に測る

context_mode は暗黙のまま。0044 の計測だけ実装する。

- 利点: 小さい。
- 欠点: 「何を渡したか」が未定義のまま測れない。

### C. Worker に会話 fork を許す

LangChain fork を実装 Task に載せる。

- 利点: キャッシュは得やすい。
- 欠点: 1周1再注入と独立レビューが溶ける。不採用。

**採用: A。** B の計測は同一票の verification に載せる（packet バイトと禁則キー）。C は載せない。

## 固定した判断

| 項目 | 決定 |
| --- | --- |
| Worker | `packet`。goal / Feature / 診断済みパス / 今周の事実。会話は継がない |
| ゲート（レビュー / plan-confirm / verify） | `isolated`。diff + criteria/ADR パス + 意図1–2行 |
| trio | `isolated` ×3。不一致は cycle に残し、条件付きで escalate |
| reflector | `packet`。cycle events と起票下書き。親チャットは禁止 |
| 親 | supervisor。会話を持ってよいが、子へは渡さない |
| 型の正本 | Rego + `node --test`。TS / Zod / Pydantic は入れない |
| Schema 文書 | 横ファイル。ゲートは読まない（[[0043]]） |
| 親の上書き | `effort`: その席の許容段だけ。`escalate`: `stay` / `trio` / `ceiling` / `human` |
| 子の自己昇格 | 不可 |
| ゲート effort を親が下げる | 不可 |
| Sol | trio 第3以外は親でも不可 |
| 実装を Opus に付け替え | 不可。役割はグラフが持つ |
| 会話キー | `learnings` / `conversation` / `decisions` / `session` は禁則 |
| 上限 | 32768 バイト。超過は truncate せず非ゼロ。空パケットは書かない |
| 0044 | 廃止しない。packet CLI と token_ledger を本票が実装する |
| 席骨格 | 0031 / 0033 / 0037 / 0040 を維持 |

## 構成（入場後の適用。本 PR では起票のみ）

1. **`required-cycle.json`**
   各ノードに `context_mode: isolated|packet`。任意ノードも同じ。
2. **`scripts/harness-query.mjs`**（0044 の未実装 CLI）
   照会結果を `knowledge/graph/packets/C-NNNN.json` に書く。
   親上書きは `dispatch.effort` / `dispatch.escalate` / `dispatch.writer: parent`。
   子フィールドを親キーにコピーしない。
3. **`policy/`**
   禁則キー、上限、席ごとの許可キー、escalate 列挙子、ゲート effort の引き下げ禁止。
4. **`knowledge/criteria/model-routing.yaml`**
   席既定 effort（0044）と許容幅。実在しないスラッグは捏造しない。
5. **ADR 0045（提案→受理は入場後）**
   0033 / 0044 を改正。会話 fork 不採用と親上書きを書く。
6. **skill**
   `harness-api-budget` / `parallel-dispatch` / `adversarial-review` / `verify` / `reflect` / `cycle`。
   ゲート入力にパケットが無ければ verify が落とす。

## データ流

```
親の tool 実行
  → 事実だけリポへ（diff / Feature / cycle / 計画 md）
  → harness-query が照会
  → packets/C-NNNN.json（≤32KiB、禁則キー無し）
  → 子 Task はそのファイルだけ
  → cycle token_ledger（席 / effort / パケットバイト / escalate）
```

## 非目標（v1）

- deepagents / LangGraph 実行基盤
- TypeScript 化、Zod、SQLite、ベクトル
- Astra / BYOK、Composer 第3レンズ
- 子またはジャッジによる任意スラッグ選択
- 親が実装席を Opus に付け替えること

## 完了の定義（この票）

1. 本 spec が判断を書き切る。
2. F-0007 が `proposed` + `adversarial_review: pending`。同一 PR で admitted / approved にしない。
3. 入場後の実装 PR で CLI / Rego / criteria / skill / テストが緑。
4. `pnpm test` と `node scripts/feature-gate.mjs` が緑（起票 PR でも維持）。

## リスク

- 会話 fork を「速いから」で足す → isolated ゲートがアンカーされる。
- 親上書きを散文で行う → cycle から消え、空成功になる。
- TS を正本にする → 0014 の偽グリーンと 0038 の二重正本。
- F-0001 の広域被覆に乗せて同一 PR で skill/Rego を適用する → 出生規則違反。
