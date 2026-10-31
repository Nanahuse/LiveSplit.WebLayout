# Split Progress

`<livesplit-split-progress>` — 終了した区間数と全区間数を「1 / 4 区間終了」の形式で表示します。

## 最小使用例

```html
<livesplit-split-progress></livesplit-split-progress>
```

## カスタマイズ例

```html
<livesplit-split-progress label="区間進捗" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-split-progress>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="split-progress"`です。ラベル不要なら`<livesplit-value field="split-progress"></livesplit-value>`でも表示できます。

## 動作・制限

未取得・未設定時の共通動作は[共通設定](../common.md)を参照してください。

[共通設定](../common.md) / [部品一覧](../README.md)
