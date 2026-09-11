# 計画/レビューを Fable 5.1 にする — 2026-09-11

計画確定と敵対レビューは Fable 5.1 high。第3は Muse medium のまま。verifier / reflector は Opus。

## なぜ計画も Fable か

plan-confirm は計画を壊すレビューである。人間が Fable 5.1 をレビューに的確だと判断したので、同じ仕事の計画席も分ける理由が無い。

## 固定

| 席 | モデル |
| --- | --- |
| plan-confirm / モード1 / trio 体1 | `claude-fable-5-1-thinking-high` |
| verifier / reflector | Opus 5 |
| trio 体2 | Grok 4.6 |
| trio 体3 | Muse medium |
| 使わない | Sol / Terra / Luna |

Fable と Opus は trio に同居しない。Fable が Opus へ落ちたら failed。
親は体1の実効モデルを確認し、落ちていたら cycle で failed にする。
適用は F-0001。0044 決定本文の完走条件は消さない。
