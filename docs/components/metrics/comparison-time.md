# Comparison Time

`<livesplit-comparison-time>` — 現在区間の比較累積タイムです。待機中から最初の区間の比較値を表示します。比較名はLiveSplit側の選択に従います。

## 配置・ラベル

```html
<livesplit-comparison-time label="現在区間の比較累積タイム" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-comparison-time>
```

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="split-target"`です。ラベル不要なら`<livesplit-value field="split-target"></livesplit-value>`でも表示できます。

[共通設定](../common.md) / [部品一覧](../README.md)
