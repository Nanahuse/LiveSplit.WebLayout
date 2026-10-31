# Timing Method

`<livesplit-timing-method>` — LiveSplitで選択中の計測方法をReal Time / Game Timeで表示します。

## 最小使用例

```html
<livesplit-timing-method></livesplit-timing-method>
```

## カスタマイズ例

```html
<livesplit-timing-method label="計測方法" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-timing-method>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="method"`です。ラベル不要なら`<livesplit-value field="method"></livesplit-value>`でも表示できます。

## 動作・制限

表示値は時計ではなく方式名です。

[共通設定](../common.md) / [部品一覧](../README.md)
