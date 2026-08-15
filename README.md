# cursor-harness

プロダクトを含まない Cursor ハーネスの**テンプレート**。製品を作る前にここから切る（[ADR 0039](knowledge/decisions/0039-harness-template-cycle-graph.md)）。

## 何をするか

- 席: 親 Grok 4.6 / Opus 5 ゲート / Sol は**高リスク3体多数決のみ**
- 正本: [`knowledge/features/F-NNNN-*.yaml`](knowledge/features/README.md)。GitHub Issues / Spec Kit は正本にしない（[ADR 0033](knowledge/decisions/0033-harness-api-budget-routing.md)）
- ゲート: OPA `node scripts/feature-gate.mjs`（自己改善ループそのものではない）
- 出生規則: Feature は `proposed` で起票する。**同一 PR で `admitted` / `approved` にしない**（[ADR 0038](knowledge/decisions/0038-feature-canon-opa-grow.md)）
- 管理: skill の使用/省略を `knowledge/graph/` に書き、ノード / 辺 / 状態の3指標で計る
- 再起的自己改善: AI 実装 PR に省略・失敗・差し戻しが残ったとき、人間がマージしたあと次 Feature の下書き PR を開く（エージェントは自動起動しない）。戻る先は Feature 起票であり、clone からやり直さない
- パッケージ: pnpm（[ADR 0041](knowledge/decisions/0041-pnpm-package-manager.md)）
- commit: hook 必須。主語は `feat:` / `fix:` / `docs:` 等 + 日本語（[ADR 0042](knowledge/decisions/0042-always-on-precommit-ja-conventional.md)）

手順の本体は [TEMPLATE.md](TEMPLATE.md)。

## 最初にやること

clone の直後は実装に入らない。hook を入れてから ADR → Feature 起票へ進む。

```bash
git clone https://github.com/marumo333/cursor-harness.git
cd cursor-harness
node scripts/install-git-hooks.mjs
```

前進の確認は `node scripts/feature-gate.mjs`（[ADR 0016](knowledge/decisions/0016-definition-of-done.md)）。ハーネスにテストがある変更は `pnpm test`。

## アーキテクチャ

層と、AI 実装 PR の問題から自己改善が回る経路を示す。元ファイルは [`docs/architecture/`](docs/architecture/)。

### ランタイム

席と強制の層。OPA は canon 変更のゲートであり、自己改善ループそのものではない。

![cursor-harness ランタイム](docs/architecture/harness-runtime-architecture.png)

### 再起的自己改善

AI 実装 PR に省略・失敗・差し戻しが残ったときだけ回る。人間のマージが点火。cycle-after-merge は下書き PR までで、エージェントは自動起動しない。OPA は横のゲート。

![再起的自己改善](docs/architecture/harness-self-improve-architecture.png)

## 構成

```
.claude/          エージェント / skill / hook
.cursor/          Cursor の hook
knowledge/        ADR / 判断基準 / Feature / グラフ / 内省
policy/           OPA（ゲートと cycle）
scripts/          feature-gate / cycle-* / githooks / commit-msg
```

Feature の起票手順は [`knowledge/features/README.md`](knowledge/features/README.md)。

## 置かないもの

認証・課金・UI・DB・e2e・配信・案件グラフ。それらは製品リポに足す。

## 由来

元リポジトリ: [marumo333/jp-code-agent](https://github.com/marumo333/jp-code-agent)。
製品コードは含めない（[ADR 0039](knowledge/decisions/0039-harness-template-cycle-graph.md)）。
