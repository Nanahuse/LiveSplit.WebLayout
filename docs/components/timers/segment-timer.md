# Segment Timer

`<livesplit-segment-timer>` は現在区間の経過時間です。

## 最小使用例

```html
<livesplit-segment-timer></livesplit-segment-timer>
```

## カスタマイズ例

```html
<livesplit-segment-timer label="区間タイマー" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-segment-timer>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。属性の型と既定の配置は[共通設定](../common.md)を参照してください。

[記録色・状態色の対象とタイミング](../../css/record-colors.md)も参照してください。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートでは値を表示する要素に`data-ls-field="segment-time"`を指定します。ラベルが不要なら`<livesplit-value field="segment-time"></livesplit-value>`でも表示できます。

## 動作・制限

完走後は最終区間の確定時間を表示します。Split / Skip / Undo直後はAttemptの再取得まで「—」になり、その後は直前の有効な累積タイムを基準に区間の経過時間を計算します。時計は描画フレームごとに更新します。

[共通設定](../common.md) / [部品一覧](../README.md)
