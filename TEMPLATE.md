# Template の使い方

このリポジトリは **プロダクトを含まない** Cursor ハーネスです。製品を作る前にここから切る。

## 空リポへ載せる

```bash
git clone https://github.com/marumo333/cursor-harness.git
cd cursor-harness
# リモートを新しい空リポに向ける
git remote set-url origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

人間が GitHub で初期コミットを確認する。以降の改善は feature branch → PR → マージ。

## 1周

1. 親は Grok。ゲートは Opus Task（plan-confirm / 敵対レビュー / verifier / reflector）。
2. 必須 skill を使ったら `cycle` skill で node/edge を記録する。
3. 再現可能な改善は `knowledge/features/F-NNNN-*.yaml` に起票する。
4. canon 変更は `node scripts/feature-gate.mjs` が入場する。
5. PR を人間がマージすると、skip が残っていれば次 Feature の draft PR が開く（エージェントは自動起動しない）。

## 置かないもの

製品の認証・課金・UI・DB・e2e・配信・案件グラフ。それらは製品リポ側に足す。
