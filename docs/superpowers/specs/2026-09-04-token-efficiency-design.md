# トークン効率（code_mode）と第3レンズ後継 — 2026-09-04

席骨格は維持したまま、ゼロ価値トークンを消す。第3レンズの後継は Gemini 3.8 Flash。
GPT-6 Astra への差し替えと Uber 工場の縮小コピーは v1 の正本にしない。

## 問い

1. GPT-6 Astra と Claude Fable 5.1 が出た。席を差し替えるべきか。トークン効率で見る。
2. [Uber Efficient Software Factory](https://www.uber.com/gb/en/blog/efficient-software-factory/) を参考に、AI トークン効率の機能を入れたい。
3. ChatGPT / OpenAI は Cursor 同梱から切れる。第3レンズの後継を選ぶ。
4. リポジトリ名を `marumo333-harness` にし、jp-code-agent から分離したという記載を消し、MIT を発行する。

## 調査結論

### モデル

| 候補 | 入力/出力 | この Task | 判断 |
| --- | --- | --- | --- |
| GPT-6 Astra | $10 / $50 | 無し。Cursor 同梱にも来ない | ピンしない |
| GPT-5.6 Sol | $4 / $20 | あり | 現行第3。同梱は 2026-11-12 まで |
| Gemini 3.8 Flash | $0.75 / $3.50 | 無し（製品カタログにはある） | **後継。effort medium** |
| Gemini 3.1 Pro | $2 / $12 | 無し | 同じ Google。Flash が秘密レンズで弱いときだけ上げる（v1 ではピンしない） |
| Fable 5.1 | $10 / $50（cache read $0.25） | あり | 天井席の世代ピンだけ |
| Composer 2.5 | $0.50 / $2.50 | あり | 第3レンズ禁止。Grok と同プール |

Astra が得になるのは長いエージェントループだけである。Artificial Analysis の Codex harness では Sol max の約 1/3、Opus 5 xhigh の約 1/5 のトークンだが、Intelligence Index（短文）では Sol より約 75% 高い。このハーネスの第3席は短文レビューなので、単価増だけが残る。

Fable 5.1 の得は cache read が 1/4 になる長いセッションである。ゲート Task は成果物パケットだけなので、天井席以外では効かない。Anthropic 自身が「まず Opus 5」と書いている。

OpenAI は SpaceX による Cursor 買収を理由に、同梱契約を 2026-11-12 に解消する。Astra など今後のモデルは移行期間中も Cursor に渡さない（[OpenAI 発表](https://openai.com/index/our-decision-on-cursor-following-its-acquisition-by-spacex/)）。BYOK は Cloud Agent Task では今動かない。正本にしない。

Gemini 3.8 Flash は Google 系列（Anthropic / Cursor-xAI のどちらでもない）。AA Intelligence Index 59 で Sol xhigh / Grok 4.6 medium と同帯。cost/task は公開値で Pareto 寄り。この Cloud Agent の Task allowlist にはまだ無い。

Composer 2.5 は Task スラッグがあるが、Cursor Models プールで Grok と同居し、SpaceXAI と次世代を訓練している。0031 のファミリー独立性を壊す。

### Uber の 6 項とこのリポ

`spend = users × sessions/user × turns/session × requests/turn × tokens/request × $/token`

伸ばすのは最初の 2 項。削るのは真ん中 3 項（エージェントが自分のために増やす仕事）。見る単位は `$/token` ではなく **完了あたり**。

| Uber のレバー | このテンプレート |
| --- | --- |
| 席ルーティング | 既にある（親 Grok / ゲート Opus / Sol は 3 体のみ） |
| 再注入削減 | 既にある（0033 の packet 注意書き） |
| code_mode（照会と中間トレースをモデルの外へ） | **v1 の本丸。** MCP 1,000 本は不要 |
| 400k compaction / cache TTL / MCP gateway | 対象外。Cursor ランタイム側 |
| 24M ノードの context graph | やりすぎ。catalog + packet で足りる |
| live cost ステータスバー | v1 では cycle の token_ledger だけ |

code_mode の意味はこのハーネスでは次である。セッション生ログをモデルに再送しない。`scripts/` が事実を照会する。モデルには SQL 相当の照会結果（JSON パケット）だけを渡し、すぐ判断とアクションへ移る。read cache は Anthropic の TTL ではなく、**リポ側に残したパケットファイル**である。品質は落ちない。ゼロ価値の中間トレースを渡さないだけで、差分・否認・cycle 指標はスクリプトが既に持っている。

## 方針（3案）

### A. 計測だけ

cycle に席・effort・パケットバイト・Task 回数を足す。席は動かさない。

- 利点: 0040 を壊さない。
- 欠点: 今すぐ枠は減らない。OpenAI sunset を正本に書けない。

### B. 計測 + 効率ポリシー + code_mode（採用）

A に加え、完了単価を世代上げ条件にし、effort を席ごとに分け、照会 CLI でパケットを強制する。Fable は 5.1。第3後継は Gemini 3.8 Flash medium。

- 利点: Uber の「ゼロ価値トークンを消す」を席・正本・ゲート・cycle に収める。
- 欠点: Feature + 技能更新が必要。Flash の Task スラッグは後追い。

### C. Uber 工場の縮小コピー

compaction 400k、cache TTL、MCP gateway、SQLite 照会言語。

- 利点: 記事に近い。
- 欠点: このテンプレートの対象外が多い。ゲートできないノブを規約だけ書いても意味が無い。

**採用: B。** 第3レンズの重さは G1（Flash medium）。Pro への逃げは同じ系列に閉じ、v1 のピンにはしない。

## 固定した判断

| 項目 | 決定 |
| --- | --- |
| 親 | Grok 4.6 のまま。ピッカーで Opus / Fable / Astra に切り替えない |
| ゲート | Opus 5 のまま |
| 天井 | Fable 5 → 5.1。役割は天井のみ。Opus との trio 同居禁止 |
| 第3レンズ今 | GPT-5.6 Sol。`expires: 2026-11-12` |
| 第3レンズ後継 | Gemini 3.8 Flash、effort medium |
| 切替条件 | allowlist にスラッグがある + trio 第3席で 1 回完走（0040 と同じ） |
| 間に合わないとき | Composer で埋めない。2 ファミリーに一時縮小。重大指摘 0 は維持 |
| Astra | ピンしない。BYOK を正本にしない |
| Composer | 第3レンズに使わない |
| リポ名 | `marumo333-harness`。clone は `github.com/marumo333/marumo333-harness` |
| 由来 | `no_jp_code_merge_write` と「jp-code-agent から分離」の叙述は持たない |
| ライセンス | MIT。著作表示は `Copyright (c) 2026 marumo333` |

0031 / 0033 / 0037 / 0040 は廃止しない。世代ピンと効率レバーだけ 0044 で改正する。

## 構成

対象は席・正本・ゲート・cycle。新しい言語ランタイムは足さない。SQLite は使わない。照会は既存 Node CLI の引数、結果は JSON。

1. **`scripts/lib/harness-query.mjs` + `scripts/harness-query.mjs`**
   `--cycle` / `--feature` / `--diff` を受け、git / cycle / catalog をこちらで読む。
   上限 32768 バイトの JSON を `knowledge/graph/packets/C-NNNN.json` に書く。
   禁則キー: `learnings` / `conversation` / `decisions` / `session`。
   超過は truncate せず非ゼロ。空パケットは書かない。
2. **cycle 計測**
   `token_ledger` イベント。席、effort、パケットバイト、Task 数、ゼロ価値再注入。
   `$` は推定しない。既存 3 指標は壊さない。
3. **`knowledge/criteria/model-routing.yaml`**
   現行 trio 第3は Sol。`sol_successor: gemini-3.8-flash`。`sol_expires: 2026-11-12`。
   `fable_exception: claude-fable-5-1-thinking-high`。
   effort: 親・実装 medium、ゲート high、第3 medium、天井 high。
   Task 実在スラッグが `high-fast` だけの席はスラッグを無理に変えない。
   `no_composer_as_third` / `packet_only_gates` / `no_astra_pin`。
4. **ADR 0044（提案）+ Feature `F-0007`（proposed）**
   同一 PR で admitted / approved にしない。
5. **skill**
   `harness-api-budget` / `adversarial-review` / `verify` / `cycle` / `reflect`。
   ゲート Task の入力はパケットだけ。パケットが無いゲート成果物は verify で落とす。
6. **アイデンティティ**
   `package.json` の name、README / TEMPLATE / catalog 見出し、MIT `LICENSE`。
   Feature 票と `cycle-after-merge` から `no_jp_code_merge_write` を消す。
   GitHub 側のリポ改名は人間が Settings で行う。文書の URL は先に揃える。

OPA はパケット形と routing キーを検査してよい。Task 起動そのものは hooks から止めない（再起禁止）。

## データ流

```
事実（git / cycle / catalog / gate）
        ↓  scripts/harness-query.mjs
パケット JSON（上限・パスだけ）
        ↓  Task 入力
判断（承認 / 差し戻し / Feature）
        ↓  cycle-record token_ledger
指標（3指標 + token 観測項）
```

失敗時: パケット超過は非ゼロ。照会欠落は空パケットを書かない。
Gemini スラッグ未実在のまま trio 第3を Flash にすると verify が落とす。

## 型の骨格

```yaml
# パケット（machine。会話を持たない）
schema: harness-query/v1
cycle: C-NNNN
feature: F-NNNN | null
diff_stat: string
metrics: object | null
catalog_hits: [{ id, path }]   # 最大 20
adr_paths: [string]            # 最大 12
# 禁則: learnings, conversation, decisions, session
```

```yaml
# token_ledger（events.jsonl の1行）
type: token_ledger
cycle: C-NNNN
seat: grok | opus | sol | fable | flash
effort: medium | high
packet_bytes: number
tasks: number
zero_value_reinject: boolean
```

## テスト

- パケット: 禁則キーが無いこと。上限超過で失敗。cycle が `C-NNNN` 以外なら組まない。
- token_ledger: 畳み込みで task_count / packet_bytes_sum / zero_value_reinject_count / seats が出る。
- 既存 cycle 3 指標と `pnpm test` を壊さない。
- feature-gate が F-0001 の通常被覆で通る（bootstrap 免除ではない）。
- catalog `--write` のあと `--check`。見出しは `marumo333-harness`。

## 非目標（v1）

- MCP gateway、code-mode 用の新言語、SQLite、ベクトル検索
- 400k compaction ランタイム、prompt cache TTL 操作
- Astra / BYOK OpenAI を席に載せる
- Composer を第3レンズにする
- GitHub リポの改名操作そのもの（人間）
- `$` の推定課金

## 完了の定義（この票）

1. 本 spec が判断を書き切る（差し替えしない席、後継 Flash、code_mode、MIT、改名）。
2. ADR 0044 が提案状態で不変条件を書く。0031 / 0033 / 0037 / 0040 は廃止せず改正注記だけ。
3. F-0007 が `proposed` + `adversarial_review: pending`（同一 PR で admitted / approved にしない）。
4. `harness-query` と `token_ledger` のテストが緑。TDD の赤ログが検証記録にある。
5. `model-routing.yaml` に successor / expires / fable 5.1 / no_composer / packet_only がある。
6. リポ表示名が `marumo333-harness`。`LICENSE` が MIT。`no_jp_code_merge_write` が無い。
7. `pnpm test` と `node scripts/feature-gate.mjs` が緑。
8. learnings 追記と cycle 記録（[[0016]]）。

## リスク

- Flash の Task スラッグが 11/12 に間に合わない → 2 ファミリー縮小。Composer で埋めない。
- パケット欠落を skill 注意書きだけにすると迂回される → verify がファイルと `validatePacket` を見る。
- 親スラッグを medium に変えると Task が静かに落ちる → 方針と実在スラッグを分ける。
- GitHub リポがまだ `cursor-harness` のまま → clone URL は先に書く。改名は人間。
- 索引や learnings をパケットに全文入れる → 禁則キーで deny。
