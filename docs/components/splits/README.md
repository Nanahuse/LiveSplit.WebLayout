# Splits

区間名、時間、比較差分を表で表示する `<livesplit-splits>` です。

## 最小使用例

```html
<livesplit-splits></livesplit-splits>
```

## カスタマイズ例

```html
<livesplit-splits settings='{"VisualSplitCount":6,"ShowColumnLabels":true,"Columns":[
  {"Name":"+/-","Type":"Delta"},
  {"Name":"Best","Type":"Comparison Segment Time","Comparison":"Best Segments"},
  {"Name":"Time","Type":"Split Time"}
]}'></livesplit-splits>
```

## 属性・settings

| 設定したいこと | 参照先 |
| --- | --- |
| 列の追加・順序・比較対象・計測方法 | [列の種類・比較対象](columns.md) |
| 表示行数・先読み・最終区間の固定・精度と既定値 | [表示設定](settings.md) |
| 接続先 | [共通設定](../common.md) |

## CSS・独自HTML

幅・枠・列幅・余白は[Splitsの装飾](style.md)、記録更新の色は[記録色](../../css/record-colors.md)を参照してください。表のHTML構造を変える場合は[独自HTMLテンプレート](../custom-markup.md)を使用できます。

## 動作・制限

既定は累積差分と累積時間の2列です。未到達のBest Segmentを常時表示したい場合はComparison Segment Time列を使います。未到達時に比較区間時間、到達後に区間差分を表示したい場合はSegment Delta or Segment Timeを使います。

区間をまとめて折りたたむ場合は[Subsplits](subsplits.md)を使用してください。

[共通設定](../common.md) / [部品一覧](../README.md)
