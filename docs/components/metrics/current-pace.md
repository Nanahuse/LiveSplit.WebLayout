# Current Pace

`<livesplit-current-pace>` — 現在選択中の比較を使った完走予測です。

## 最小使用例

```html
<livesplit-current-pace></livesplit-current-pace>
```

## カスタマイズ例

```html
<livesplit-current-pace label="Current Pace" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-current-pace>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="current-pace"`です。ラベル不要なら`<livesplit-value field="current-pace"></livesplit-value>`でも表示できます。

## 動作・制限

比較の最終値と直前に確定した差分から計算します。

[共通設定](../common.md) / [部品一覧](../README.md)
