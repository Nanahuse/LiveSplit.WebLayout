# Previous Split

`<livesplit-previous-split>` — 直前に終了した区間までの累積実測タイムです。区間単体の所要時間はPrevious Segment Timeを使用してください。

## 配置・ラベル

```html
<livesplit-previous-split label="直前の累積タイム" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-previous-split>
```

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="last-split"`です。ラベル不要なら`<livesplit-value field="last-split"></livesplit-value>`でも表示できます。

[共通設定](../common.md) / [部品一覧](../README.md)
