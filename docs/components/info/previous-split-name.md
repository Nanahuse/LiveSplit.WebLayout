# Previous Split Name

`<livesplit-previous-split-name>` は直前区間の名前です。

## 最小使用例

```html
<livesplit-previous-split-name></livesplit-previous-split-name>
```

## カスタマイズ例

```html
<livesplit-previous-split-name label="直前の区間" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-previous-split-name>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。属性の型と既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートでは値を表示する要素に`data-ls-field="previous-split"`を指定します。ラベルが不要なら`<livesplit-value field="previous-split"></livesplit-value>`でも表示できます。

## 動作・制限

待機中は「—」です。時間の表示はPrevious SplitやPrevious Segment Timeを使います。

[共通設定](../common.md) / [部品一覧](../README.md)
