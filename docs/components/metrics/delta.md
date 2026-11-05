# Delta

`<livesplit-delta>` は選択中比較に対する累積差分です。

## 最小使用例

```html
<livesplit-delta></livesplit-delta>
```

## カスタマイズ例

```html
<livesplit-delta label="比較との差" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-delta>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。属性の型と既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

差分の色は`--ls-ahead` / `--ls-behind`が値の通常色に優先します。

独自テンプレートでは値を表示する要素に`data-ls-field="delta"`を指定します。ラベルが不要なら`<livesplit-value field="delta"></livesplit-value>`でも表示できます。

## 動作・制限

現在区間だけの差分はLive Segmentを使用してください。

[共通設定](../common.md) / [部品一覧](../README.md)
