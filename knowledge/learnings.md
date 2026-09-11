# learnings.md — 自己成長ループの記憶（実行ごとに追記）

<!-- 人が読む文は日本語。機械キー・コマンド・パスは英語のまま。 -->

各タスク完了時に `worked` / `failed` / `edge cases` を追記する（人が読む本文は日本語）。
再現可能な改善は Feature 正本（`knowledge/features/`）に起票し、OPA 入場後に昇格する（[[0038]]）。
ハーネスの実行日記だけを書く（[[0039]]）。

---

## 2026-09-11 — 工場比喻を監査 / token効率化へ置換（F-0011 / C-0011）

**問い**

- README の工場比喻（工場長 / 治具 など）を正本語彙（席・正本・ゲート・cycle）へ寄せ、
  後退を機械判定で止められるか。

**worked**

- 人間指示の写像をそのまま固定した。治具 code-mode → `token効率化`、工場長 → `監査`。
  ソフトウェア工場 / 工場フロア / 工程カード / 抜き取り / 検査 / 振り返り / 出荷 / 正本倉庫 / 原料 も置換。
- TDD 赤は新テストが `### 監査` 不在で失敗（アサーションを先に置き README を後で直した）。置換後 3/3 緑。
- 旧語を `doesNotMatch` で固定したので、次周に工場語が戻ると赤になる。
  用語の一貫性を人の読みではなく `scripts/license-readme.test.mjs` に落とせた。
- 触ったのは表示テキストだけ。mermaid の node id（`plant` / `warehouse` / `ship`）と
  C-0009 が固定した禁止辺（`FG --> warehouse` / `Gate --> Feat` / `HK --> AR` / `HG --> CanonOut`）・
  cycle 辺（`AR --> VR` / `VR --> RF` / `HM --> warehouse`）は変えていないので、権限モデルのテストは緑のまま。
- `pnpm test` 113、`opa test` 77、`feature-gate` 成功（F-0001 被覆）。F-0011 は proposed のまま、入場しない。
- commit 2b41e05 は origin に push 済みで PR 14。C-0009 でブロッカーだった push 権限は解消している。

**failed / edge cases**

- C-0009 のエントリは当時の現物（工場 mermaid・工場語のノード名）を書いている。履歴なので消さない。
  現行 README の第1図見出しは「監査」で、C-0009 の記述と現物のずれは本エントリで吸収する。
- 「工場」を全文一括置換すると、棄却済み他社概念の固有名
  （`docs/superpowers/specs/2026-09-04-token-efficiency-design.md` の「Uber 工場」）まで巻き込む。
  禁止語の適用範囲は README に限定し、非対象を設計メモに明記した。
- F-0011 のファイル名は `F-0011-mit-license-factory-diagram.yaml` のまま。
  出生票のパスは動かさず、`title` と `problem` だけ現行語彙へ直した。
- 用語修正でもテスト列挙は既存のまま済んだ。新規テストファイルを足していないので、
  C-0009 で踏んだ `package.json` と `.github/workflows/feature-gate.yml` の二重列挙は再発しない。
- trio は Fable 承認 / Grok 承認 / Muse が初回差し戻し（読了範囲不足）→ seq4 の再レビューで承認。
  Muse は packet の `diff_stat` が略称だけだと現物を読まずに判定に入る。席の傾向として記録する（[[0031]]）。
- 原因は packet 側にある。commit 後は `git diff --stat` が空なので親が
  `README LICENSE TEMPLATE package.json ...` と略称を手書きし、レビュー席が必読パスを引けない。
  再現可能な改善なので F-0012 を proposed で起票した。
- plan-confirm は並列展開なしで省略、harness-grow は入場なしで省略。

---

## 2026-09-11 — MIT と工場 mermaid（F-0011 / C-0009）

**問い**

- 複製先に法的包装（LICENSE）を付け、README の構造図を静的 PNG から mermaid 正本へ移せるか。

**worked**

- `scripts/license-readme.test.mjs` が3点を機械判定する。LICENSE は OSI MIT の全文一致、
  `package.json` の `license` は MIT、README は mermaid 3図（工場 / ランタイム / 再起的自己改善）。
- TDD 赤は LICENSE 不在の `existsSync` false。追加後に緑。
  `pnpm test` 113、`opa test` 77、`feature-gate` 成功で前進可能。
- 図は禁止辺を `doesNotMatch` で固定した（`FG --> warehouse` / `Gate --> Feat` / `HK --> AR` / `HG --> CanonOut`）。
  必須辺は `AR --> VR` / `VR --> RF` / `HM --> warehouse`、OPA は「判定のみ」表記。
- 旧 PNG は `docs/architecture/` に履歴として残した。README 本文は PNG を参照しない。
- 適用は F-0001 被覆。F-0011 は proposed のまま。0044 決定本文は消していない。

**failed / edge cases**

- CI のテスト実行は `node --test` の明示列挙なので、新テストは `package.json` の `test` と
  `.github/workflows/feature-gate.yml` の両方に足さないと緑のまま走らない。片方追記が初回の指摘点。
- 初回 trio は体1/体2が差し戻し。「欠落 PNG」の誤記（実体は履歴として存在）、工程順が逆、
  ゲートから倉庫へ抜ける辺、Fable が hooks を踏む表記、CI 未列挙。
- 再レビューも体1が差し戻し。`HK --> AR` は hooks からレビューへ出る辺、`HG --> CanonOut` は
  allow を迂回する直結。図の矢印1本が権限モデルの誤読を作るので、禁止辺はテスト側に落とした。
- 3回目 trio で 3/3 承認。plan-confirm は並列展開なしで省略、harness-grow は入場なしで省略。
- ブロッカー: 環境の `GITHUB_TOKEN` が無効で origin へ push できず、PR 作成は
  「remote に commits が無い」で失敗した。ローカル `cursor/mit-license-factory-diagram-1dcb` に 3 commit。
  ゲートが全部緑でも push 権限は verify の外側で落ちる。

---

## 2026-09-11 — ディスパッチ packet を本 PR で実装する（F-0007 / C-0010）

**問い**

- トークン効率の本丸（子に会話を継がない / 何バイト渡したか測る）をこの prime で入れるか。

**worked**

- `harness-query` が `C-NNNN.<node>.<seq>.json` を gitignore 配下に書く。32KiB・空・禁則キーは失敗。
- `packet.rego` は deny 空だけ。幅1 effort、canon 周の stay、子の自己昇格、Muse の第3外を落とす。
- `token_ledger` は観測だけ。3指標 / `need_rerun` は変えない。
- F-0007 は proposed のまま。適用は F-0001。0045 は新規。0044 決定本文は消さない。
- TDD 赤は `ERR_MODULE_NOT_FOUND` / `foldTokenLedger` 未 export。その後 assertion 緑、`pnpm test` 100、feature-gate 成功。

**failed / edge cases**

- `some k; k in input.child_keys` は OPA で unsafe。完全ルール `child_promotes if "effort" in ...` に分解した。
- 人間指示で起票と同じ PR に適用した。admit はしない。
- plan-confirm は並列展開していないので省略。
- 初回 trio 3/3 差し戻し: `packet.rego` が opa test 専用で dispatch に刺さっていなかった。
  sha256 形式だけ見て実体と突合せず、欠落は fail-open、`--seq` で単調増加を迂回できた。
  執行点を `cycle-record --type dispatch` に移し、node×seat から役割を導出し、欠落は deny にした。
- 再レビューも差し戻し。`--canon-path-count` 自己申告と git 失敗時の 0 を廃し、
  席を dispatch_seats に固定、Muse は escalate trio 必須、`--adr` の symlink を拒否した。
- 3回目 trio: review 席から grok（体2）が落ちていた。GIT_DIR 偽装で件数 0 にできた。
  空 feature を事実とみなしていた。体2を review_trio に戻し、git 環境変数を無視し、空値を事実から外した。
- 4回目は 1/3。GIT_DIR テストが実リポ差分に依存し main で赤になる。diff_stat 空白が事実扱い。
  テストを一時リポに移し、空白 diff_stat も空にした。
  続けて ZWSP と PATH 偽 git を塞いだ。HARNESS_ROOT 差し替えは残る（CLI の作業根）。

---

## 2026-09-11 — Uber code-mode を本 PR に入れる（F-0010 / C-0009）

**問い**

- Ultra でも効率と精度を同時に取る。記事の bash 一括は入っているか。

**worked**

- 2+ 照会の生 `&&` は hook deny。`scripts/code-mode.mjs --step` 1回が正。
- 要約 JSON のみ。上限超過は truncate せず失敗。
- commit-guard は code-mode の `--step` 内 `--no-verify` も見る。
- F-0010 は proposed。適用は F-0001。harness-query（F-0007）は別のまま。

**failed / edge cases**

- hook は未来の turn を結合できない。バラした単発照会は止めない。
- TDD 赤は当初 `ERR_MODULE_NOT_FOUND`（`/tmp/code-mode-red.log`）。
- cache TTL は触らない。

---

## 2026-09-11 — 計画/レビューを Fable 5.1、第3を Muse に揃える（F-0009 / C-0008）

**問い**

- 計画確定は Opus のままでよいか。レビューは Fable 5.1 の方が的確か。
- 第3を Muse に完全に差し替えるか。

**worked**

- 計画と敵対レビューは Fable 5.1 high。verifier / reflector は Opus。
- trio は Fable / Grok / Muse。Fable と Opus は同居させない。
- 第3の現行ピンは Muse medium。0044 決定1 も Sol を現行から外した。
- Fable の Opus フォールバックは failed。

**failed / edge cases**

- Fable は約2倍。Privacy Mode は保持オプトインが要る。
- 検証席まで Fable にはしない。機械判定に払う理由が薄い。
- 初回 trio は 3/3 差し戻し。0044 決定本文を再び書いた、C-0008 を learnings だけに書いた、
  受理 ADR の決定本文を in-place 置換した、F-0009 に F-0001 適用経路が無かった、
  F-0007 spec が Sol 第3のまま、0040 の役割不変条件への免除が無かった。
- 決定本文は戻して改正注記だけ現行ピンにする。適用経路は F-0008 と同じ文を 0047 に書いた。

---

## 2026-09-11 — 第3レンズを Muse Spark 1.3 にする（F-0008 / C-0007）

**問い**

- OpenAI 同梱切れの前に、第3席をどの独立ファミリーへ切るか。

**worked**

- 人間が Flash 待ちを上書きし、現行ピンを `muse-spark-1.3-medium` にした。
- 系列は Anthropic / xAI / Meta。Composer / Fable / Sol は第3に使わない。
- F-0008 は `proposed` のまま。適用は F-0001 の in_progress 被覆。
- F-0007 起票 PR とこの切替を一つの PR にまとめた。

**failed / edge cases**

- 初回 trio は体1/体2が差し戻し。C-0006 を F-0007 と二重に書いた、0044 決定本文を書き換えた、
  `sol_seat` 削除で deny が弱く見えた、F-0008 の `supersede_adr` が false のまま ADR を改正した。
- C-0007 に直し、0044 本文は戻し、`no_sol_terra_luna` を置いた。適用は F-0001（F-0003 と同じ）。
- Muse は聞き返しを訓練している。不確実は差し戻し、を skill に足した。
- Kimi / GLM は Desktop のみ。Task スラッグが無いのでピンしない。

---

## 2026-09-10 — ディスパッチ packet 起票（F-0007 / C-0006）

**問い**

- Graph / Loop / Judge / LangChain context mode をこのハーネスに写すとき、
  親から子へ何を継ぎ、誰が model / effort を変えてよいか。

**worked**

- 会話 fork は不採用。写すのはリポに落ちた事実の JSON packet（isolated / packet）。
- 親の effort / escalate 上書きはノード属性として残す。子の自己昇格は不可。
- 型の正本は TypeScript ではなく Rego（0014 / 0043）。
- 本周は出生規則どおり F-0007 を `proposed` だけ起票。admit しない。

**failed / edge cases**

- 0044 の `harness-query` は未実装のまま。本票が入場後に実装する。
- 指名できる xAI 個人の「evals をエージェントが持て」ツイートは一次ソース未確定。
  公式は Grok 4.6 カード §5。採点関数はループの外（InferenceEval / 本リポの OPA）。
- F-0001 の `approved` 自己申告（C1）はこの PR では直さない。
- 初回敵対レビューは差し戻し。paths の部分木被覆、supersede_adr、escalate の引き下げ、
  平文 writer、packet 保管が抜けていた。票をファイル単位に直し、spec に閉じた。
- 再レビューも差し戻し。F-0001 和集合でファイル単位が強制にならないこと、
  stay の高リスク判定が散文だったことを認め、自票パス追加と機械導出を spec に書いた。
- 三回目は高リスク集合の手書き列挙が 73 ファイルを漏らした。canon 非空を高リスクに倒す。
- 四回目は低リスク例外が evidence と skill を単独レンズに落とした。例外は置かない。

---

## 2026-08-18 — 三層知識 TLK（F-0006 / C-0005）

**問い**

- 複数エージェントが knowledge と ADR を全文読込するので、AI 層 / 中間層 / 人間層の三層と
  「764 次元 ontology」を作れと求められた。

**worked**

- 調査で「3 聴衆 × 764 次元」の完成規格は存在しないと確認した。外部記事の 764 は
  埋め込み次元 768 の誤記が大半だった。数値を仕様の主語にしないと決めた。
- 埋め込みベクトルを入場判定に使う案は落とした。取得内容を判断根拠に昇格させる形になり
  [[0018]]（取得内容/ツール出力はデータ扱い）と衝突する。
- 採用は三層知識 TLK。machine（Feature / criteria / policy）が正本、index（`catalog.json`）は
  advisory な地図、human（ADR / learnings）は読み物。index は派生で何も決定しない。
- Pydantic は入れない。依存ゼロ（Node のみ）を保ち、形の正本は OPA / Rego 側に置いた。
- 差し戻しは全部実装前・マージ前に落ちた。plan-confirm 3 回 → 敵対レビュー 4 回で計 7 件。
- 席は親 Grok 4.6、設計 / レビュー / 検証は Opus Task。Sol は 3 体多数決の条件に届かず未使用。
- 検証は `pnpm test` 77 件と feature-gate が緑。

**failed**

- plan-confirm の差し戻し 4 点: index の識別子が Feature / ADR と衝突（id 衝突）、
  catalog が古いまま参照される鮮度、CI での再生成・検証が無い、
  `summary` が原文の代替として読まれる。設計段で 3 回往復してから承認になった。
- 敵対レビューの差し戻し 4 点: 外部由来 id を catalog キーにできる id 注入、
  Feature の `status` 欠落を許容、生成器が symlink 経由でツリー外を読む、
  `HARNESS_ROOT` 差し替えでゲート外のファイルを正本として読める。
- F-0006 は `proposed` のまま。今回の canon 適用は F-0001 の広域被覆に依存する（既知 C1 の続き）。
- `adversarial_review: approved` は依然自己申告。レビュー成果物ハッシュとの突合は未実装。

**edge cases**

- 「index は決定しない派生」と明文化しないと、agent が `catalog.summary` を根拠に入場を判断する。
  README に「入場・被覆・不変条件は Feature / criteria / policy の原文を読む」を書いた。
- `HARNESS_ROOT` はテストに必要で消せない。ゲート内スクリプトはルート由来のパスだけ信頼する。
- `catalog.json` は生成物で canon 外。生成器（`scripts/`）と `required-cycle.json` は canon 側。
- 764 / 768 のような外部由来の数値は ADR に書かない。必要になったら根拠付きで criteria に落とす。
- 新規 Feature は起票しない。今周の改善は F-0006 に収まり、残る 2 件（F-0001 広域被覆・
  レビュー証跡の突合）は新発見ではなく既知限界の持ち越しなので重複起票しない。

---

## 2026-08-15 — ADR 0039 をハーネス制約に言い換え（文書）

**問い**

- ADR 0039 の題と本文が排除リストになっていた。
- README に由来と「置かないもの」の節があった。

**worked**

- 0039 の題と決定をハーネス制約（席・正本・ゲート・cycle）に言い換えた。
- README / TEMPLATE / ADR / skill から排除リストと由来の記述を消した。
- F-0002 は `proposed` のまま。適用被覆は F-0001。

**failed**

- kind `product` は OPA 互換のため残し、表の説明だけ未使用にした。
- ランタイム図の排除リストフッタは再描画で消した。図は canon 外。

**edge cases**

- clone URL の `marumo333/cursor-harness` はこのリポの実体なので残した。
- 「並列展開案件」はグラフの案件ではないので残した。

---

## 2026-08-15 — 常時 pre-commit と日本語 conventional 主語（F-0005）

**問い**

- 実装後の commit が Claude PreToolUse だけだと迂回できる。主語が英語。
- 1周合計のトークンを、KV cache / Kimi K3 / Obsidian で減らせるか。

**worked**

- git / Cursor / Claude の三重 hook。`--no-verify`・連鎖・略記・`GIT_CONFIG_*`・空 hooksPath を拒否。
- 主語は `feat:` 等 + 日本語。Merge / Revert / fixup は例外。
- 敵対レビューの C1（`git add && git commit --no-verify` が allow）をテストで先に赤にして直した。

**failed**

- hook 自体は入力トークンを減らさない。節約は席への再注入削減（packet）側。
- CI の主語検査は先端だけ。0042 以前の英語コミットは書き換えない。
- `node` 不在の GUI git と OPA 未導入環境では commit が止まる（fail-closed）。

**edge cases**

- Cursor hook はシェルコマンド文字列に `--no-verify` が含まれるだけで deny する。
- F-0005 は `proposed`。適用被覆は F-0001。

---

## 2026-08-15 — PR レビュー指摘の再修正（F-0004）

**問い**

- 受理 ADR の決定文がまだ 4.5。親スラッグが Task に無い xhigh。npm 前提。
- clone 直後に実装へ飛ぶ。README に設計図が無い。0026 が Sonnet/Haiku 委譲のまま。

**worked**

- 0031/0033/0037 の決定文を Grok 4.6 にした。0026 に現行注記（実装は Grok 4.6、Sonnet/Haiku 委譲は廃止）。
- criteria の親/Task を `cursor-grok-4.6-high-fast` に揃えた。xhigh は努力段として残し、ピンにはしない。
- パッケージマネージャを pnpm に固定（ADR 0041）。
- TEMPLATE/0039 に clone → ADR 技術選定 → Feature → 実装。README に Mermaid。
- reflect の評価トークンを `worked` / `failed` / `edge cases` に戻した。

**failed**

- F-0004 は `proposed`。canon 適用は F-0001 被覆（既知 C1）。
- allow から pnpm を外した。`node --test:*` も `--import` で任意実行できるので、テストは完全一致だけ許す。
- `pnpm check` は script 欠落時に PATH の `check` を実行するので `pnpm run check` にした。
- TEMPLATE の「起票直後に入場」は出生規則と衝突するので、起票 PR マージ → 次 PR 実装に直した。
- README / TEMPLATE / pnpm-lock.yaml を canon に入れた。CI は `node --test` 直呼び（第三者 Action なし）。

**edge cases**

- xhigh は 4.6 に存在する。Task allowlist に xhigh-fast が無いので criteria には書かない。

---

## 2026-08-15 — 親/trio の Grok 席を 4.6 に更新（ADR 0040 / F-0003）

**問い**

- 親の実体は `cursor-grok-4.6-xhigh-fast` なのに、文書と criteria が 4.5 / 旧スラッグのまま。
- 4.6 GA 後、他席（Opus / Sol / Fable / Composer）も動かす必要があるか。

**効いた**

- 公式（2026-08-12）は 4.6 を長時間エージェントと指示追従の後継と明記。同一 Cursor Models 枠。
- 旧スラッグ `grok-4.5-fast-xhigh` は廃止済み。Task 実在は `cursor-grok-4.6-high-fast`。
- 親スラッグは実体の xhigh-fast、trio/並列展開は Task allowlist の high-fast に分けた。
- Opus 5 / Sol / Fable / Composer / Auto は据え置き。席骨格（0033/0037）は触らない。
- 旧 ADR 本文は歴史として残し、改正注記と 0040 だけを正本にした。

**失敗 / リスク**

- Cursor ヘルプの available-models はまだ flagship=4.5、Router 必須も 4.5。文書遅れを理由に戻さない。
- F-0003 は `proposed`。同一 PR で admitted にしない。canon 適用は merge-base の F-0001 で被覆。
- Task に 4.6 非 Fast / xhigh-fast が無い。親 UI スラッグを Task に渡すと静かにフォールバックし、3ファミリーが壊れる。
- 旧ピン `grok-4.5-fast-xhigh` は 4.5 に無い努力段を含んでおり、改名前から無効だった。
- help の 4.5 Fast 出力 $18 と Models & Pricing の $12 が食い違う。価格差は差し替え理由に使わない。
- 敵対レビュー: F-0003 の `supersedes: [0031,0033,0037]` は骨格廃止に読めるので空にした。
  `chat_orchestrator` と `grok_task` を分けた。旧 ADR 決定箇条に「旧・0040」を打った。
  F-0001 広域被覆は既知 C1 の続きなのでこの票では直さない。

**次**

- 次の Grok 世代は GA + Task スラッグ実在 + 公式の長時間/指示追従根拠が揃ってから ADR+Feature。
- Claude/Sol も同じ条件。ヘルプの flagship 表記だけでは動かさない。

---

## 2026-08-14 — ハーネス制約と有界サイクル（ADR 0039 / F-0002）

**問い**

- ハーネスの対象（席・正本・ゲート・cycle）が文書で揺れていた。
- 自己改善は1周の手順だけで、skill 省略の3指標もマージ後の再起も無かった。

**効いた**

- 対象を席・正本・ゲート・cycle に閉じた。
- 必須ノードの used/skipped を `knowledge/graph/events.jsonl` に書き、node/edge/state を出す。
- 再起は人間の PR マージ後だけ。hooks から Task は起動しない。metrics 緑なら止める。
- `events.jsonl` は canon 外（追記ログ）。必須集合は `required-cycle.json` だけ。
- cycle.rego はキー欠落を deny。`gh pr list` 失敗は未処理扱い（欠落で拒否）。
- 再起は省略/失敗がある周だけ。空サイクルの integrity=0 では量産しない。
- feature-gate は PR ツリーの `*.test.mjs` を実行しない（信頼ゲート内の遠隔コード実行を回避）。
- `cycle-record` は node/state を検証し、`human_approved` は after-merge 専用。
- `cycle.admission.deny` が配列でなければ終了コード 1。壊れた events.jsonl は書き換えない。

**失敗 / リスク**

- Actions が Feature YAML を書く。`proposed` + `mutates_canon: false` に閉じ、エージェントは起動しない。
- `adversarial_review: approved` は依然自己申告（F-0001 既知限界の続き）。
- PR #1 が main に入った時点で F-0001 bootstrap は切れた。`bootstrap: true` のままでは
  以降の apply が全 deny になる。導入後は `bootstrap: false` にする。
- F-0002 は同一 PR で admitted にできない（出生規則）。今回の canon 適用は
  merge-base 上の F-0001（in_progress + review approved）で被覆する。

**次**

- 必須 skill をこの周で記録し、緑なら merge 後に再起しないことを確認する。

---

## 2026-08-14 — Feature 正本 + OPA grow 入場（ADR 0038 / F-0001）

**問い**

- 自己改善は learnings 日記 + skill 直接書き換えで、作業正本が無かった。

**効いた**

- 正本を `knowledge/features/F-NNNN-*.yaml` に置いた。GitHub Issue は正本にしない。
- reflector = 起票、grow = OPA allow の票だけ適用。F-0001 bootstrap は human + 1回限り。
- deny 空だけを見る。キー欠落は helper 完全ルール。`mutates` は diff 導出。

**失敗 / リスク（敵対レビューで確認済み → 修正済み）**

- `not (x in set)` の hoisting、bootstrap 恒久化、新規 Feature の自己承認、OPA_BIN 回避。

**既知の限界**

- `adversarial_review: approved` とレビュー成果物ハッシュの突合は未実装。

---

## 2026-08-14 — 人が読む文面を日本語に揃える

**効いた**

- ADR 見出し（状態/日付/背景/決定/結果/関連）、workflow の PR 文面、操作者向けエラー、OPA deny 文を日本語にした。
- YAML キー・コマンド・パス・状態値（proposed 等）は機械参照のため英語のまま。

**失敗 / リスク**

- deny 文を変えたので、英語文字列を固定していたテストも追従が必要。

---

## 2026-08-14 — 残っていた人が読む英語を洗い出して直す

**問い**

- 見出しと操作者向け文は日本語化済みだったが、説明文・コメント・用語に英語が残っていた。

**効いた**

- skill/agent の説明、ADR 本文、コメント、deny の「真偽値」を日本語にした。
- 機械キー・コマンド・パス・状態値・パッケージ名は英語のまま。

**失敗 / リスク**

- 用語を訳しすぎると、状態値（`skipped` 等）と説明文が食い違う。説明は日本語、値は英語で揃える。

---

## 2026-08-14 — 入場の欠落キーを閉じる

**効いた**

- `--admit` が `feature_in_merge_base` を渡さず、未定義だと出生 deny が発火しなかった。
- admit/apply は両キーを必須にした。learned / `*_test.rego` は副作用付き builtin を拒否する。
- `MERGE_SHA` は十六進だけ通す。

**失敗 / リスク**

- F-0001 の `adversarial_review: approved` 自己申告（C1）はこの PR では直さない。
  同じ票で evidence 突合を入れると今回の apply が止まる。次 Feature で直す。
- 欠落キー deny を足したあと、既存の拒否テストにキーを足さず 14 本が空振りした。
  全拒否テストにキーを明示し、policy 配下は再帰走査＋ package 正本固定にした。
- package 名の文字列判定は `grow["admission"]` と symlink で抜けた。
  `opa inspect` の解決済み名前空間と、正本 8 ファイル以外の拒否で閉じた。
- 名前空間照合をファイル名だけにすると `learned/grow.rego` へ正本を移して抜けた。
  policy 相対パスで突き合わせる。
