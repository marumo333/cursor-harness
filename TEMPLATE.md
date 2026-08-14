# テンプレートの使い方

このリポジトリは **プロダクトを含まない** Cursor ハーネスです。製品を作る前にここから切る。

## 空リポへ載せる

```bash
git clone https://github.com/marumo333/cursor-harness.git
cd cursor-harness
# リモートを新しい空リポに向ける
git remote set-url origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

人間が GitHub で初期コミットを確認する。以降の改善は feature ブランチ → PR → マージ。

## 1周

1. 親は Grok。ゲートは Opus Task（計画確定 / 敵対レビュー / 検証 / 内省）。
2. 必須 skill を使ったら `cycle` skill でノードと辺を記録する。
3. 再現可能な改善は `knowledge/features/F-NNNN-*.yaml` に起票する。
4. canon 変更は `node scripts/feature-gate.mjs` が入場する。
5. PR を人間がマージすると、省略が残っていれば次 Feature の下書き PR が開く（エージェントは自動起動しない）。

## 置かないもの

製品の認証・課金・UI・DB・e2e・配信・案件グラフ。それらは製品リポ側に足す。
