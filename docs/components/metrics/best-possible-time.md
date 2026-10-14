# Best Possible Time

`<livesplit-best-possible-time>` — 個別Best Segmentを使った最速完走予測です。現在区間がBest Segmentを超えた場合は現在の経過時間を使います。全Attempt履歴を使う結合区間の最適化は未対応です。

## 配置・ラベル

```html
<livesplit-best-possible-time label="Best Possible Time" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-best-possible-time>
```

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="best-possible"`です。ラベル不要なら`<livesplit-value field="best-possible"></livesplit-value>`でも表示できます。

[共通設定](../common.md) / [部品一覧](../README.md)
