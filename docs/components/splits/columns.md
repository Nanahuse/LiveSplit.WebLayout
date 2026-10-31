# Splits：列の種類・比較対象

`settings.Columns` で区間表の数値列を追加・削除・並べ替えます。設定なしの `<livesplit-splits>` は **+/−（Delta）とTime（Split Time）の2列**です。

## 最小使用例

```html
<livesplit-splits></livesplit-splits>
```

## カスタマイズ例

累積差分、Best Segmentsに対する区間差分、Personal Bestの累積タイムを表示する例です。

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

## Columnsの設定

`Columns` は0〜32列のJSON配列です。空配列 `[]` なら区間名だけになります。設定は表示専用のHTMLに記述し、画面上の操作パネルはありません。本体の設定を自動インポートする機能もありません。

| キー | 型 | 省略時 | 内容 |
| --- | --- | --- | --- |
| `Name` | 文字列 | Typeの値 | 列名。Custom Variable列では変数名 |
| `Type` | 文字列 | 必須 | 下表のColumn Typeを指定 |
| `Comparison` | 文字列 | Current Comparison | 比較対象。Run内の比較名を指定 |
| `TimingMethod` | 文字列 | Current Timing Method | Current Timing Method / Real Time / Game Time |
| `Width` | 数値または文字列 | 自動幅 | Web版の拡張。数値ならpx。詳しくは[列幅](style.md) |

`Type` は本体の表示名（`Split Time`、`Segment Delta or Segment Time`など）をそのまま使えます。比較名から列を自動生成しないため、Best Segmentsでも累積差分と区間差分のどちらを使うかはTypeで指定します。

## 列の種類

| Type（空白なしの表記） | 本体のColumn Type | 現在・未完了区間 | 完了区間 |
| --- | --- | --- | --- |
| `SplitTime` | Split Time | 比較の累積タイム | 今回の累積タイム |
| `SegmentTime` | Segment Time | 比較の区間タイム | 今回の区間タイム |
| `Delta` | Delta | 条件成立後の累積差分 | 確定した累積差分 |
| `SegmentDelta` | Segment Delta | 条件成立後の区間差分 | 確定した区間差分 |
| `DeltaorSplitTime` | Delta or Split Time | 累積差分、未表示なら比較タイム | 累積差分、欠損なら今回のタイム |
| `SegmentDeltaorSegmentTime` | Segment Delta or Segment Time | 区間差分、未表示なら比較区間タイム | 区間差分、欠損なら今回の区間タイム |
| `CustomVariable` | Custom Variable | 現在区間のみ現在の変数値、未到達区間は空欄 | Split時の変数値。未設定は空欄 |

Custom Variableは公式と同様にNameを変数名として使います。例えば `{"Name":"Deaths","Type":"Custom Variable"}` と指定します。値をHTMLとしては解釈しません。開始前はすべて空欄です。

### Web版の拡張列

| Type | 表示するもの |
| --- | --- |
| `ComparisonTime` | 比較の累積タイムを固定表示 |
| `LiveTime` | 現在区間では走行中の累積時計、完了区間では確定タイム |
| `ComparisonSegmentTime`（Comparison Segment Timeも可） | 比較の区間タイムを固定表示 |

本体のSplit Timeは走行中の時計ではないため、LiveTimeと区別します。Comparison Segment Timeは、ComparisonがBest SegmentsならBridgeの個別Best Segment、Personal Bestなどならその比較の区間タイムを表示します。区間完了・スキップ・完走後も今回の実測値には切り替わりません。Real Time / Game Timeと列幅の指定にも対応し、未設定値は「—」です。

```json
{"Name":"Best Segment","Type":"Comparison Segment Time","Comparison":"Best Segments","Width":"7ch"}
```

## 動作・制限

### 比較対象と計測方法

`Current Comparison` はLiveSplit本体で選択中の比較です。Runに存在しない比較名は選択中の比較に戻します。区間系の列で `Best Split Times` を指定した場合も `Current Comparison` に戻します。

Bridgeが両計測方式の比較・実測値を提供するため、各列で計測方法を独立に指定できます。未設定のGame TimeはReal Timeに置き換えず「—」で表示します。

### 区間タイム・差分と記録色

公式のSegment TimeはBest Segmentsを含むどの比較でも直前の有効な累積比較値との差です。比較値が欠けた区間は遡って計算します。完了区間の区間差分は、実測値と比較値の両方がある直前の区間を基準にします。スキップ区間の確定値は「—」です。

`ShowBestSegments`（真偽値、既定true）は本体のLayout設定に相当する指定です。このWeb版ではSplitsのsettingsに置き、Best Segment超過によるライブ差分開始と、完了した差分列のBest Segment色を制御します。通常の時間列・Custom Variable列には記録色を適用しません。

Bridgeから全区間の比較値と現在Attemptを取得するため、未到達区間・途中接続時の比較値も表示します。アイコン・本体固有の装飾設定は未対応です。色やフォントはCSSで設定します。

## 関連設定

表示範囲は現在区間に合わせて移動し、既定は8行・先読み1行・最終区間固定です。`total-splits` / `upcoming-splits` / `always-show-last-split` などは[表示設定](settings.md)、色・フォント・列幅は[装飾](style.md)を参照してください。

旧 `columns` 属性・小文字キー・`comparisons` の扱いは[対応範囲と移行](../../compatibility.md)に、公式実装との照合元は[開発・検証](../../development.md)にまとめています。

[表示設定](settings.md) / [装飾](style.md) / [Splits目次](README.md)
