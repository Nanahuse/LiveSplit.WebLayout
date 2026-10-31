# Phase

`<livesplit-phase>` — 走行状態を「待機中」「計測中」「一時停止」「完走」で表示します。

## 最小使用例

```html
<livesplit-phase></livesplit-phase>
```

## カスタマイズ例

```html
<livesplit-phase label="走行状態" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-phase>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="phase"`です。ラベル不要なら`<livesplit-value field="phase"></livesplit-value>`でも表示できます。

## 動作・制限

接続状態はStatusを使います。

[共通設定](../common.md) / [部品一覧](../README.md)
