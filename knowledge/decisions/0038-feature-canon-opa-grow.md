# ADR 0038: 自己改善の正本は Feature、入場は OPA

- Status: Accepted
- Date: 2026-08-14
- Context: 自己成長ループ（reflect → learnings → harness-grow → skill/ADR/criteria）は文書と
  リマインダ hook としては存在する。しかし **作業項目の正本が無い**。内省は `learnings.md` に
  追記され、昇格は reflector が skill/ADR を直接書き換える。`post_task_reflect` は stderr 促し
  だけで起票しない。結果として、自己改善はチャットと日記に閉じ、次周が拾うバックログにならない。
  判断基準は YAML/Markdown を LLM が解釈するため、入場条件（レビュー済か、対象パスか、ADR を
  黙って上書きしていないか）がセッションごとに揺れる。
- Decision:
  1. **Feature が自己改善の正本**。起票先は `knowledge/features/F-NNNN-*.yaml`（git 上の構造化票）。
     GitHub Issue / Spec Kit は正本にしない（[[0033]] の成果物二重化回避を維持。Issue は任意の鏡）。
  2. **reflector は起票する。直接昇格しない。** learnings は日記、Feature は作業正本、
     skill/ADR/criteria/Rego は入場後の適用先。
  3. **OPA/Rego は生成ではなく入場（admission）**。何を学ぶかは LLM、昇格してよいかは決定的ポリシー。
     学習した不変条件は `policy/learned/` に Rego として蓄積できる（kind=`harness-rule`）。
  4. **機械ゲート** `node scripts/feature-gate.mjs`。canon パスの正本は `policy/canon.rego` のみ。
     被覆判定は `deny` 集合が空であること（`allow` 完全ルールは信用しない）。
     強制点: `pre_commit_guard` と `.github/workflows/feature-gate.yml`。
     main にゲートが載った後、CI は **main の policy/scripts** で PR を判定する。
  5. **導入自己参照**は merge-base に F-0001 が**存在しない**コミットだけ。票を後から触っても再武装しない。
     新規 Feature を admitted / review-approved で生まれさせない。`status: done` は apply 不可。
  6. **入場は fail-closed。** 必須キー欠落は deny。`mutates_canon` は必須 boolean。
     merge-base 未解決は exit 1。複数票は和集合。`policy/learned` は判定 package を名乗れない。
- Consequences: 自己改善が「日記への追記」から「正本起票 → 決定的入場 → 適用」になる。
  精度の主レバーは LLM を大きくすることではなく、昇格の可否をテスト可能なポリシーに置くこと
  （[[0026]] / [[0031]] と整合）。OPA に内省文生成を載せない（誤ツール）。GitHub Issue を正本に
  すると knowledge と二重化するのでやらない。
- Links: [[0016-definition-of-done]] [[0033-harness-api-budget-routing]]
  [[0037-opus5-gate-routing]] [[0039-harness-template-cycle-graph]]
