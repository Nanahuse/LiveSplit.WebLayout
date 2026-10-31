# Real Time

`<livesplit-real-time>` — 選択中の計測方法にかかわらずReal Timeを表示します。

## 最小使用例

```html
<livesplit-real-time></livesplit-real-time>
```

## カスタマイズ例

```html
<livesplit-real-time label="Real Time" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-real-time>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="real-time"`です。ラベル不要なら`<livesplit-value field="real-time"></livesplit-value>`でも表示できます。

## 動作・制限

TimerStateを750ms周期で再同期し、走行中はブラウザーの時計で補間します。

[共通設定](../common.md) / [部品一覧](../README.md)
