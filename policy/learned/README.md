# policy/learned/ — 自己改善が落とす決定的ルール

kind=`harness-rule` の Feature が入場したあと、不変条件をここに `*.rego` で追加する（[[0038]]）。

- 手順（どうやるか）は skill に残す。
- 可否（やってよいか）だけを Rego にする。
- テスト (`*_test.rego`) 無しの learned ルールは入場しない（`feature-gate` が `opa test` する）。

導入時点ではスロットのみ。最初の学習ルールは次の admitted Feature で追加する。
