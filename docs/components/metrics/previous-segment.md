# Previous Segment

`<livesplit-previous-segment>` は直前区間の比較差分です。

## 最小使用例

```html
<livesplit-previous-segment></livesplit-previous-segment>
```

## カスタマイズ例

```html
<livesplit-previous-segment label="Previous Segment" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-previous-segment>
```

```html
<livesplit-previous-segment bs-effect="rainbow"
  settings='{"Comparison":"Personal Best","ShowPossibleTimeSave":true,"Display2Rows":true}'></livesplit-previous-segment>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。属性の型と既定の配置は[共通設定](../common.md)を参照してください。

| 設定 | 型 | 既定値 | 用途 |
| --- | --- | --- | --- |
| `Comparison` | 文字列 | Current Comparison | 比較対象 |
| `Display2Rows` | 真偽値 | false | trueで上下配置。既定は左右配置 |
| `DropDecimals` | 真偽値 | true | 1分以上の差分の小数を省略 |
| `DeltaAccuracy` / `TimeSaveAccuracy` | 文字列 | Tenths | 差分／短縮可能時間の精度 |
| `ShowPossibleTimeSave` | 真偽値 | false | 短縮可能時間を併記 |

ShowPossibleTimeSaveで「差分 / 短縮可能時間」を表示します。精度はSeconds / Tenths / Hundredths / Milliseconds。実測所要時間は[Previous Segment Time](previous-segment-time.md)を使います。

[記録色・状態色の対象とタイミング](../../css/record-colors.md)も参照してください。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

差分の色は`--ls-ahead` / `--ls-behind`が値の通常色に優先します。

独自テンプレートでは値を表示する要素に`data-ls-field="previous-segment-delta"`を指定します。この専用タグの内側で使用してください。専用settingsと計算は汎用Valueでは実行されません。

## 動作・制限

ライブ差分の条件が成立すると現在区間の差分に切り替わり、既定ラベルも「Live Segment」になります。スキップで実測がない区間は「—」です。

[共通設定](../common.md) / [部品一覧](../README.md)
