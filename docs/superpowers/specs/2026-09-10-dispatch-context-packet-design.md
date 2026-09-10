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
親は dispatch レコードに `effort` / `escalate` を書いてよい。Rego が許容幅を見る。
子が同じキーを返したら **deny し cycle に残す**（黙って無視しない）。

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
| 親の上書き | `effort`: 許容幅が2要素以上のときだけ。幅1なら上書きは hard deny |
| escalate | `stay` / `trio` / `ceiling` / `human`。意味は下表 |
| 子の自己昇格 | 不可。試行は deny + cycle |
| ゲート effort を親が下げる | 不可 |
| Sol | trio 第3以外は親でも不可 |
| Fable / ceiling | ゲート既定の代替には使わない（[[0037]]）。追加レビューだけ |
| 実装を Opus に付け替え | 不可。役割はグラフが持つ |
| 会話キー | `learnings` / `conversation` / `decisions` / `session` は禁則 |
| 値の扱い | packet 本文はデータ。命令にしない。スポットライトで囲む（[[0018]]） |
| 上限 | 32768 バイト。超過は truncate せず非ゼロ。本文の代わりに path + rev を載せる |
| 空パケット | 書かない |
| 保管 | `knowledge/graph/packets/*.json` は gitignore。CI は一時ファイルで検査 |
| ファイル名 | `C-NNNN.<node>.<seq>.json`。1周1ファイルにしない |
| writer | 平文 `writer: parent` は信用しない。親が `cycle-record` した dispatch 行とバイトダイジェストが一致すること |
| token_ledger | 観測専用。`need_rerun` の条件を増やさない（[[0039]]） |
| 0044 | 廃止しない。packet CLI と token_ledger を本票が実装する。既存 ADR ファイルは上書きしない |
| ADR 0045 | 新規ファイルのみ。`supersede_adr: false` |
| 席骨格 | 0031 / 0033 / 0037 / 0040 を維持 |
| レビュー | 起票 PR はモード1。適用 PR は高リスクのためモード2（trio） |

### escalate の意味

| 値 | 許す条件 | 禁止 |
| --- | --- | --- |
| `stay` | 既定席のまま | 高リスク条件を満たす周で trio を外すこと |
| `trio` | 高リスク（入場 / 再起 / セキュリティ / アーキ）だけ | 日常レビューの常時 trio |
| `ceiling` | ゲート不一致または criteria の天井条件があるとき、**追加**レビュー | Opus ゲートの代替、trio への Fable 同居 |
| `human` | 常に可。再起・入場の最終鍵 | エージェントが `human_approved` を書くこと |

## 構成（入場後の適用。本 PR では起票のみ）

1. **`required-cycle.json`**
   各ノードに `context_mode: isolated|packet`。任意ノードも同じ。
2. **`scripts/harness-query.mjs`**（0044 の未実装 CLI）
   照会結果を `knowledge/graph/packets/C-NNNN.<node>.<seq>.json` に書く（gitignore）。
   親上書きは cycle の dispatch イベント（席 / effort / escalate / sha256）が正本。
   子フィールドを親キーにコピーしない。
3. **`policy/packet.rego`**（新規。`deny` 集合が空だけを見る。`allow` 完全ルールは置かない）
   `scripts/feature-gate.mjs` の PACKAGE_HOME / 名前空間許可に `packet.canon` を足す。
   `policy/grow.rego` `canon.rego` `feature.rego` は触らない。
4. **`knowledge/criteria/model-routing.yaml`**
   席既定 effort（0044）と許容幅。実在しないスラッグは捏造しない。幅1は上書き deny。
5. **ADR 0045（新規ファイル・提案。入場後に受理）**
   会話 fork 不採用と親上書きを書く。0033 / 0044 のファイルは上書きしない。
6. **列挙した skill 6本**
   ゲート入力にパケットが無ければ verify が落とす。本文はスポットライト囲み。
7. **`package.json` と `.github/workflows/feature-gate.yml`**
   `harness-query.test.mjs` を `pnpm test` と CI 列挙に足す。未列挙の偽グリーンは禁止。
8. **`.gitignore`**
   `knowledge/graph/packets/*.json`。`.gitkeep` だけ残す。

## データ流

```
親の tool 実行
  → 事実だけリポへ（diff / Feature / cycle / 計画 md）
  → harness-query が照会（値はデータ。命令として解釈しない）
  → packets/C-NNNN.<node>.<seq>.json（≤32KiB、禁則キー無し、gitignore）
  → cycle dispatch 行の sha256 と一致しなければ子を起動しない
  → 子 Task はそのファイルだけ（スポットライト囲み）
  → token_ledger（観測。再起条件には使わない）
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
- `policy/` や `scripts/` を部分木で被覆する → ゲート自身を書き換えられる。票の paths はファイル単位。
- 既存 ADR に `supersede_adr: true` で空の supersedes → 17 本の無言上書き。0045 は新規のみ。
- `escalate: stay` で高リスク trio を外す / `ceiling` で Opus を代替する → 0033 / 0037。
- 平文 `writer: parent` だけを信じる → 子が自己昇格を書ける。cycle ダイジェスト必須。
- token_ledger を `need_rerun` に足す → 0039 の有界再起が壊れる。
- packet をコミットする → 秘密が hook をすり抜けうる。gitignore + 一時ファイル検査。
