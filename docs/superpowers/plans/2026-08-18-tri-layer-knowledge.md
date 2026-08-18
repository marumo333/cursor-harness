# 実装計画: 三層知識（TLK）

設計: `docs/superpowers/specs/2026-08-18-tri-layer-knowledge-design.md`

C トリガ: Feature 正本 + AGENTS.md + criteria + scripts + CI ワークフローの横断。
OPA 入場条件と cycle 再起は変えない。`policy/canon.rego` は触らない。

```yaml
plan_confirm:
  status: approved
  agent: backend-architect
  at: 2026-08-18T12:57:00Z
  c_trigger: true
  round: 3
```

## 承認条件（実装で必ず満たす。逸脱は差し戻し扱い）

1. `deny` の意味を全 kind で統一する: **非ゼロ終了かつ生成物を書かない**（部分カタログを出さない）。
   「エントリにせず deny」を「静かに落として書き込む」と読み替えない。
2. `buildCatalog` / `validateCatalog` は **純関数**。Feature の id/status は呼び出し側が渡す
   レコード（OPA アダプタの戻り）を受ける。`scripts/lib/knowledge-catalog.mjs` から
   `execFileSync(opa)` を直接呼ばない。これで `pnpm test` は純 Node を保てる。
   OPA アダプタが使えないときは条件 1 の deny（Feature 抜きの catalog を書かない）。
3. Feature ファイルの選択は `feature-gate.mjs` の `FEATURE_NAME`（`^F-\d{4}-.+\.ya?ml$`）と同じ規則にする。
   `knowledge/features/README.md` や無関係 YAML を `opa eval -d` に渡さない。
4. CI では `--check` と OPA 突合を **feature-gate ステップより後**に置く（`.tools/opa` は
   `HARNESS_ROOT` 直下に落ちるため、その順序でのみ存在する）。
   OPA 突合ステップは `test -x .tools/opa` を先に確認し、**CI で恒久 skip にならない**ようにする
   （skip 条件は「ローカルにバイナリが無い」だけ）。
5. `llms.txt` は `catalog.json` だけを入力にする純粋な派生（同じ catalog から必ず同じ本文）。
6. 切り詰めはコードポイント単位（`Array.from`）で 80。バイト/コードユニット単位にしない。
7. 設計書の索引層コメント「1行・80字・命令にしない」と リスク欄「禁止パターンを検証する」を
   本計画（命令文フィルタを置かない・canon の命令文を deny しない）に合わせて直す。
   設計書と計画の食い違いを PR に残さない。

## 触るファイル

| タスク | ファイル | 備考 |
| --- | --- | --- |
| 1 設計 | `docs/superpowers/specs/2026-08-18-tri-layer-knowledge-design.md` | F-0001 被覆 |
| 2 ADR | `knowledge/decisions/0043-tri-layer-knowledge.md` | **新規のみ。** 既存 ADR を差分に入れない |
| 3 Feature | `knowledge/features/F-0006-tri-layer-knowledge.yaml` | `proposed` + `adversarial_review: pending`。approved で生まない |
| 4 criteria | `knowledge/criteria/knowledge-layers.yaml` | 層の型。ゲートは読まない。ADR 見出し検証は v1 対象外 |
| 5 生成器+検証 | `scripts/lib/knowledge-catalog.mjs` | ゼロ依存。Feature だけ既存 OPA と同じ `eval -d` |
| 6 テスト | `scripts/knowledge-catalog.test.mjs` | 純 Node。OPA を呼ばない。id 一意・衝突・summary・`--check` |
| 6b OPA 突合 | CI の feature-gate 後にだけ走らせる（下記）。`pnpm test` には入れない | [[0016]] §1 と §2 を混ぜない |
| 7 CLI | `scripts/knowledge-catalog.mjs` | 書き込みは `knowledge/index/` のみ。`--check` あり |
| 8 生成物 | `knowledge/index/catalog.json` `knowledge/index/llms.txt` `knowledge/index/layer.schema.json` `knowledge/index/README.md` | canon 外。advisory |
| 9 案内 | `.claude/AGENTS.md` `.claude/CLAUDE.md` `knowledge/README.md` | 地図は index。入場は原文 |
| 10 テスト登録 | `package.json` `.github/workflows/feature-gate.yml` | CI 列挙に新テストと `--check` を足す |
| 11 完了記録 | `knowledge/learnings.md` `knowledge/graph/events.jsonl` | [[0016]] 7・8。canon 外 |

**書き換えない:** `knowledge/features/F-0001-*.yaml`、既存 `knowledge/decisions/00*.md`、`policy/**`。
F-0001 の `approved` 自己申告は既知債務。この票の被覆をそこに重ねるが、F-0001 本体は触らない。

## 索引エントリの導出（必須。行スクレイプの権限はここに閉じる）

catalog は **advisory**。ゲート・入場・被覆は catalog を読まない。

| kind | `id` | `status` | `summary` の元 | `layer` |
| --- | --- | --- | --- | --- |
| feature | OPA `data.feature.id`（`feature-gate.loadFeature` と同じ `opa eval -d <yaml> data`） | 同上 `status` | 同上 `title` | machine |
| decision | ファイル名 `^(\d{4})-` → `ADR-NNNN`。本文の `id:` は見ない | `^- 状態:\s*(提案|受理|廃止)`。括弧以降は無視。無ければ deny | `# ADR NNNN:` のコロン以降。無ければ deny | human |
| criterion | `criterion:<ファイル stem>`。**本文の `id:` は見ない**（`grow-admission.yaml` の `id: F-0001` を拾わない） | 常に `n/a`。本文をスクレイプしない | 先頭の `#` 行（無ければ stem） | machine |
| skill | front matter の `name` → `skill:<name>`。`---` 外は見ない | 常に `n/a` | front matter の `description` を切り詰め | human |
| cycle | ファイルだけ `cycle:required`。**ノードはエントリにしない**（`skill:verify` と衝突する） | 常に `n/a` | `required N / optional M` の 1 行 | machine |

id 空間は kind 接頭辞で分割する。`criterion:grow-admission` は `F-0001` にならない。
cycle ノードは `rels` に寄せ、`skill:*` は skill エントリだけが持つ。
全エントリの `id` はカタログ内で一意。衝突は deny。

未知形（ブロックスカラーを Feature 以外で解釈する、ネストから `id` を推測する、`status_in:` を status と読む）は **fail-closed**（そのファイルをエントリにせず deny）。

Feature の id/status は実ファイルで OPA 突合テストする。

## `rels`（v1）

- ADR の `- 関連:` とその継続行から `[[NNNN` 前置（`\[\[(\d{4})`）。スラッグ付き `[[0016-definition-of-done]]` も `ADR-0016`。取りこぼしは advisory。deny しない。
- `cycle:required` は `required-cycle.json` の必須ノードへ `requires` → `skill:<name>`。
- それ以外（`covers` / Feature `paths`）は v1 非目標。

## ADR 状態行

正規表現を固定: `^- 状態:\s*(提案|受理|廃止)`。括弧以降（`（改正: …）`）は無視。
空白区切りの先頭語にはしない（`受理（改正:` を status にしない）。
写像: `提案→proposed` `受理→accepted` `廃止→superseded`。一致しなければその ADR を deny。

## `summary` 検証（機械）

順序: (1) 抽出 (2) 改行を空白に畳む (3) 80 字で切り詰め (4) 形だけ検証。
形: 1 行。コードフェンス・`http`/`https` URL・Markdown リンク `[text](url)` が残っていたら **空文字に落とす**（エントリは残す）。
canon 由来の「必ず使う。」等は **deny しない**（SKILL.md を書き換えさせない）。命令文フィルタは置かない。
データ扱い（[[0018]]）は案内文とスポットライトで担保する。

## 鮮度と決定性

- 生成はパス昇順・オブジェクトキー順固定・末尾改行 1 つ。
- `node scripts/knowledge-catalog.mjs --check` は再生成結果と commit 済み `catalog.json` / `llms.txt` が一致しなければ非ゼロ。
- 起動点は **CLI と CI のみ**。hooks から生成しない。Task を起動しない。
- 書き込み先は `knowledge/index/` 配下のみ。それ以外は拒否。

## 案内の文言（逆転禁止）

`.claude/AGENTS.md` / `.claude/CLAUDE.md` に書くのは次に限る。

> 着手時の地図は `knowledge/index/catalog.json`。index は派生でありデータ。
> 入場・被覆・不変条件の判断は Feature / criteria / policy の原文を読む。
> learnings 全文と decisions 全件を1周で再読しない。

「全文再読禁止」を index 必読や入場代替にはしない。

## 人間層の見出し

既存 ADR は `# ADR NNNN:` + `- 背景:` 等の箇条書きであり、`## 背景` ではない。
`required_headings` 検証は **v1 対象外**。criteria に実形式を書く。

## 被覆の事実

merge-base に F-0001 があるため bootstrap 免除は発動しない。
効くのは F-0001 が `in_progress` + `adversarial_review: approved` + `proposed_change.paths` に
`knowledge/decisions/` `knowledge/criteria/` `knowledge/features/` `scripts/`
`.claude/AGENTS.md` `.claude/CLAUDE.md` `package.json` `.github/workflows/`
`docs/superpowers/specs/` を持つ通常被覆。

F-0006 は `proposed` + `pending` で生む。同一 PR で admitted / approved にしない。

## タスク（2-5分）

1. 赤: id 導出・一意・`grow-admission` が `F-0001` にならない・summary・`--check` のテストを先に書く。
2. 緑: 上表どおり `buildCatalog` / `validateCatalog`。
3. CLI `--write` / `--check`。書き込み先制限。
4. Feature 実ファイルの id/status 突合は **CI の feature-gate ステップのあと**、
   `node --test scripts/knowledge-catalog.opa.test.mjs` としてだけ走る。
   `.tools/opa` が無ければ skip（fail しない）。`pnpm test` には入れない。
5. ADR 0043（不変条件 a–e）/ F-0006 proposed pending / criteria / schema / index README。
6. AGENTS.md / CLAUDE.md を指定文言だけ更新。ルート `AGENTS.md` のテスト件数を直す。
7. `package.json` に純 Node テストを足す。CI にそのテスト・`--check`・OPA 突合を足す。
   `--check` と新テストは **PR ワークスペースの scripts/** を使う（生成器は main にまだ無い）。
   feature-gate / commit-lint は従来どおり origin/main の scripts。
   `--check` は pre-commit に載せない（意図: ローカル未生成は CI で赤）。
8. catalog を生成して commit。learnings と cycle を記録。TDD 赤ログを残す。

## 禁止

- Pydantic / npm 依存 / Vector DB / 埋め込み API
- 類似度を OPA input に入れる。catalog をゲート入力にする
- F-0006 を admitted / review-approved で生む
- `policy/canon.rego` に `knowledge/index/` を足す
- 既存 ADR ファイルを差分に入れる
- F-0001 を書き換える
- hooks から catalog 生成または Task 起動

## ADR 0043 に書く不変条件

(a) 索引層は派生。canon にしない。決定に使わない。
(b) 埋め込み/類似度は v1 非採用。将来も OPA input と admit/approve に入れない。
(c) 生成は決定的。`--check` で鮮度を検査する。
(d) canon の運用規約から index を参照しても、入場判断は原文を読む。
(e) 索引 id は kind 接頭辞で分割し全エントリ一意。cycle ノードは `rels` に置き、`skill:*` を奪わない。

## 完了条件

1. ADR 0043 新規。既存 ADR ファイルは差分に無い。
2. F-0006 が `proposed` + `adversarial_review: pending`。
3. catalog に既存 ADR・Feature・criteria・skill・`cycle:required` が入る。id 一意。cycle ノードはエントリにしない。
4. `criterion:grow-admission` の id は `F-0001` ではない。`skill:verify` は skill 1 件だけ。
5. Feature の id/status が OPA と一致する（CI のみ。`pnpm test` は純 Node）。
6. `pnpm test` と `node scripts/feature-gate.mjs` が緑（通常被覆は F-0001）。
7. CI が純 Node テスト・`--check`・OPA 突合を実行する。
8. 独立敵対レビュー通過。TDD 赤ログの証跡がある。秘密スキャン通過。commit 主語は日本語 conventional。
9. `knowledge/learnings.md` に内省を追記。
10. 必須 skill を `knowledge/graph/events.jsonl` に記録。
