# 第3レンズを Muse Spark 1.3 にする — 2026-09-11

第3席の現行ピンを GPT-5.6 Sol から Muse Spark 1.3 medium へ移す。席骨格は触らない。

## 問い

OpenAI 同梱切れの前に、第3レンズをどの独立ファミリーへ切るか。

## 固定した判断

| 項目 | 決定 |
| --- | --- |
| 現行第3 | `muse-spark-1.3-medium` |
| 役割 | 秘密漏れ・無害化・allow 信用。モード2以外禁止 |
| 予備 | Gemini 3.8 Flash medium（スラッグ消失時のみ。新 ADR） |
| 使わない | Sol / Terra / Luna / Composer / Fable / Kimi / GLM / Qwen |
| isolated | 質問せず承認か差し戻し |
| 出生 | F-0008 は `proposed`。同一 PR で admit しない。適用は F-0001 被覆 |

詳細は [[0046]]。
