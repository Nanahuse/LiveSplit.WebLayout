# Splits：列の種類・比較対象

設定なしの `<livesplit-splits>` は、本体既定の **+/−（Delta）とTime（Split Time）の2列**です。比較名から列を自動生成しません。Best Segmentsでも累積差分と区間差分のどちらを使うかは `Type` で指定します。

`settings` の `Columns` 配列が本体の列一覧に相当します。`Name`（列名）、`Type`（Column Type）、`Comparison`（比較対象）、`TimingMethod`（計測方法）を各列に指定してください。配列の編集で追加・削除・並べ替えができ、空配列なら区間名だけになります。画面上の操作パネルは追加せず、表示専用のHTML設定です。

```html
<livesplit-splits settings='{
  "VisualSplitCount": 8,
  "SplitPreviewCount": 1,
  "ShowColumnLabels": true,
  "Columns": [
    {"Name":"+/-","Type":"Delta","Comparison":"Current Comparison","TimingMethod":"Current Timing Method"},
    {"Name":"Best","Type":"Segment Delta","Comparison":"Best Segments","TimingMethod":"Current Timing Method"},
    {"Name":"Time","Type":"Split Time","Comparison":"Personal Best","TimingMethod":"Current Timing Method"}
  ]
}'></livesplit-splits>
```

`Type` は本体の表示名（`Split Time`、`Segment Delta or Segment Time`など）をそのまま使用できます。`Current Comparison` は本体で選択中の比較です。Runに存在しない比較名は本体同様に選択中の比較へ戻します。区間系の列で `Best Split Times` を指定すると `Current Comparison` に戻します。

`TimingMethod` は `Current Timing Method` / `Real Time` / `Game Time`。Bridgeが両方式の比較・実測値を提供するため、各列で独立に指定できます。未設定のGame TimeはReal Timeに置き換えず「—」で表示します。

互換性のため従来の `columns` 配列と小文字のキーも受け付けます。`columns` 属性は `settings.Columns` より優先します。旧 `comparisons="Personal Best|Best Segments"` は従来の独自列セットを明示的に使う互換指定であり、公式互換の設定には使用しないでください。

| `type` | 本体のColumn Type | 現在・未完了区間 | 完了区間 |
|---|---|---|---|
| `SplitTime` | Split Time | 比較の累積タイム | 今回の累積タイム |
| `SegmentTime` | Segment Time | 比較の区間タイム | 今回の区間タイム |
| `Delta` | Delta | 条件成立後の累積差分 | 確定した累積差分 |
| `SegmentDelta` | Segment Delta | 条件成立後の区間差分 | 確定した区間差分 |
| `DeltaorSplitTime` | Delta or Split Time | 累積差分、未表示なら比較タイム | 累積差分、欠損なら今回のタイム |
| `SegmentDeltaorSegmentTime` | Segment Delta or Segment Time | 区間差分、未表示なら比較区間タイム | 区間差分、欠損なら今回の区間タイム |
| `CustomVariable` | Custom Variable | 現在区間のみ現在の変数値、未到達区間は空欄 | Split時の変数値。未設定は空欄 |

`Custom Variable`は公式と同様に列の`Name`を変数名として使います（例：`{"Name":"Deaths","Type":"Custom Variable"}`）。HTMLとしては解釈しません。開始前はすべて空欄です。

公式の`Segment Time`は、Best Segmentsを含むどの比較でも直前の有効な累積比較値との差です。比較値が欠けた区間は遡って計算します。完了区間の区間差分は、実測値と比較値の両方がある直前の区間を基準にします。スキップ区間の確定値は「—」です。

`ShowBestSegments`（既定true）は本体のLayout設定に相当する指定です。このWeb版ではSplitsの`settings`に置き、Best Segment超過によるライブ差分開始と、完了した差分列のBest Segment色を制御します。通常の時間列・Custom Variable列は記録色にしません。

列の表示分岐は公式の[SplitComponent.UpdateColumn](https://github.com/LiveSplit/LiveSplit.Splits/blob/master/src/LiveSplit.Splits/UI/Components/SplitComponent.cs)、差分計算は[LiveSplitStateHelper](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Model/LiveSplitStateHelper.cs)と照合しています。

追加の `ComparisonTime` は比較累積タイムを固定表示、`LiveTime` は現在区間で走行中の累積時計、完了区間で確定タイムを表示します。本体の `Split Time` は走行中の時計ではないため、両者を区別しています。

`ComparisonSegmentTime`（`Comparison Segment Time`も可）は比較区間タイムを常に表示するWeb版の拡張列です。`Comparison: "Best Segments"`ならBridgeの個別Best Segment、`Personal Best`などならその比較の区間タイムを表示します。区間完了・スキップ・完走後も今回の実測値には切り替わりません。Real Time／Game Timeの指定と列幅の設定にも対応します。未設定値は「—」です。

```json
{"Name":"Best Segment","Type":"Comparison Segment Time","Comparison":"Best Segments","Width":"7ch"}
```

`total-splits` は表示行数、`upcoming-splits` は先読み行数、`always-show-last-split` は最終区間の固定表示です。現在区間に合わせて表示範囲が移動します。省略時は本体既定の8行・先読み1行・最終区間固定です。

Bridgeから全区間の比較値と現在Attemptを取得するため、未到達区間・途中接続時の比較値も表示します。設定は本体から自動インポートしません。アイコン・本体固有の装飾設定は未対応です。色やフォントはCSSで設定します。

[Splits目次](README.md)
