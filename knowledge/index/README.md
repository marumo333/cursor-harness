# knowledge/index/ — 三層知識の地図（[[0043]]）

派生。canon ではない。入場・被覆・不変条件は Feature / criteria / policy の原文を読む。

| ファイル | 役割 |
| --- | --- |
| `catalog.json` | エージェントが最初に読む短い索引 |
| `llms.txt` | catalog だけから作る案内 |
| `layer.schema.json` | 形の説明（ゲートは読まない） |

再生成: `node scripts/knowledge-catalog.mjs --write`  
鮮度: `node scripts/knowledge-catalog.mjs --check`（CI。pre-commit には載せない）
