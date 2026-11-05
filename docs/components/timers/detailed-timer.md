# Detailed Timer

全体タイマー・現在区間名・区間タイマー・2つの比較区間タイムを表示します。

## 最小使用例

```html
<livesplit-detailed-timer></livesplit-detailed-timer>
```

## カスタマイズ例

```html
<livesplit-detailed-timer comparison1="Personal Best" comparison2="Best Segments"
  settings='{"ShowSplitName":true,"SegmentAccuracy":".2","DecimalsSize":50}'
  style="--ls-timer-size:80px; --ls-segment-size:32px"></livesplit-detailed-timer>
```

## 属性・settings

`comparison1` / `comparison2`属性は対応するsettingsより優先します。

| 設定 | 型 | 既定値 | 用途 |
| --- | --- | --- | --- |
| `Comparison` / `Comparison2` | 文字列 | Current Comparison / Best Segments | 比較1・比較2の比較名 |
| `HideComparison` | 真偽値 | false | trueで比較2のみ非表示 |
| `ShowSplitName` | 真偽値 | false | 現在区間名を表示 |
| `DigitsFormat` / `SegmentDigitsFormat` | 文字列 | 1 | 1 / 1:23 / 1:23:45から最低桁数を選択 |
| `Accuracy` / `SegmentAccuracy` | 文字列 | .23 | 空文字／.2／.23で秒／1桁／2桁 |
| `SegmentTimesAccuracy` | 文字列 | Hundredths | 比較欄の精度。Seconds / Tenths / Hundredths |
| `SegmentTimerSizeRatio` | 数値 | 40 | 区間時計のサイズ比率（%）。0〜1000 |
| `DecimalsSize` / `SegmentTimerDecimalsSize` | 数値 | 35 | 各時計の小数サイズ（%）。0〜1000 |

`comparison1` / `comparison2` は文字列属性です。省略時は上表のComparison / Comparison2を使用します。共通の `server`・記録色属性は[共通設定](../common.md)を参照してください。

## CSS・独自HTML

| 変数・対象 | 用途 |
|---|---|
| `--ls-timer-size` / `--ls-decimal-size` / `--ls-time-font` | 全体時計。サイズ5rem、小数.35emが既定 |
| `--ls-segment-size` / `--ls-segment-ratio` | 区間時計のサイズ／比率。サイズ指定が優先 |
| `--ls-segment-color` / `--ls-segment-decimal-size` | 区間時計の基本色／小数サイズ |
| `--ls-segment-name-size` / `--ls-segment-name-color` | 区間名。既定1em / inherit |
| `--ls-comparison-label-font` / `--ls-comparison-label-color` | 比較名。既定inherit |
| `--ls-comparison-value-size` / `--ls-comparison-value-color` | 比較値。既定1em / inherit |
| `--ls-comparison-gap` / `--ls-content-gap` | 比較欄の上部間隔／左右間隔。既定1em |
| `.ls-segment-name` / `.ls-comparison-times` / `dt` / `dd` | 区間名／比較欄／比較名／比較値 |

公開CSS変数 → settings → 既定値の順に優先します。`--ls-setting-*`は内部用です。[PB・状態色](../../css/record-colors.md)が時計の基本色に優先します。

独自HTMLでは全体時計に`data-ls-field="whole|fraction"`、区間時計に`data-segment-whole` / `data-segment-fraction`、比較名と値に`data-comparison-label="1|2"` / `data-comparison-value="1|2"`を配置します。各`|`は選択肢を示し、属性値には片方を指定します。

## 動作・制限

比較欄は待機中には最初の区間、走行中には現在の区間、完走後には最終区間の参照値を表示します。Best SegmentsはBridgeの個別Best Segment、他の比較は比較の区間時間です。比較タイムが未設定の場合は「—」です。アイコンの表示と本体と異なる計測方法の選択は未対応です。

[共通設定](../common.md) / [部品一覧](../README.md)
