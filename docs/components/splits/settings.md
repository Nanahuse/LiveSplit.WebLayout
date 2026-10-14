# Splits：表示設定

`settings` の直下に以下を指定できます。名前は公式の設定保存名に合わせています。

| 設定 | 公式UIの項目 | 既定値 |
|---|---|---|
| `VisualSplitCount` | Total Splits | 8 |
| `SplitPreviewCount` | Upcoming Splits | 1 |
| `AlwaysShowLastSplit` | Always Show Last Split | true |
| `ShowBlankSplits` | Fill with Blank Space if Not Enough Splits | true |
| `LockLastSplit` | Lock Last Split to Bottom | true |
| `SeparatorLastSplit` | Show Separator Before Last Split | true |
| `ShowThinSeparators` | Show Thin Separators | true |
| `ShowColumnLabels` | Show Column Labels | false |
| `Display2Rows` | Display 2 Rows | false |
| `SplitTimesAccuracy` | Split Times / Accuracy | Seconds |
| `DeltasAccuracy` | Deltas / Accuracy | Tenths |
| `DropDecimals` | Drop Decimals When More Than 1 Minute | true |
| `ShowBestSegments` | 本体Layout相当のBest Segment表示 | true |

`Columns`は[列設定](columns.md)を参照してください。`total-splits` / `upcoming-splits` / `always-show-last-split`属性は、それぞれ対応するsettingsより優先します。最終区間固定を無効にするには`always-show-last-split="false"`を指定します。表示行数は1〜1000、先読み行数は0以上の整数で、先読みは利用できる表示行数に収まるよう調整されます。

`live-delta="false"`で現在区間のライブ差分を無効にできます。省略時は有効です。

Accuracyは `Seconds` / `Tenths` / `Hundredths` / `Milliseconds`。差分は本体と同様、1分未満なら `+1.2` のように表示し、ゼロにプラス記号を付けません。現在・未到達区間のDelta / Segment Deltaは表示条件が成立するまで空欄です。ライブ値の元タイマーは現在1/100秒精度のため、Milliseconds指定でもライブ差分にそれ以上の精度はありません。

Bridgeの個別Best SegmentとBest Segments比較を使ってライブ差分の開始条件を判定します。比較や必要な時間が未設定の場合は「—」です。

比較値はRunStateから全区間まとめて取得します。列の途中追加や表示開始前の区間にも利用できます。列を増やしてもRPC件数は増えません。

セルの `data-comparison` は比較名、`data-column` は `comparison-time` / `delta` / `time`、`data-column-type` は[列設定](columns.md)のtypeです。現在区間のセルには `data-live-column`、行には `data-split-index` が付きます。列を装飾する例:

```css
livesplit-splits [data-column="comparison-time"] { opacity: .65; }
```

[Splits目次](README.md)
