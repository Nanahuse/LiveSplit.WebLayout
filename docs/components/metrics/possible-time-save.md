# Possible Time Save

`<livesplit-possible-time-save>` — 比較の区間時間から個別Best Segmentを引き、負なら0にした短縮可能時間です。

## 最小使用例

```html
<livesplit-possible-time-save></livesplit-possible-time-save>
```

## カスタマイズ例

```html
<livesplit-possible-time-save label="Possible Time Save" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-possible-time-save>
```

```html
<livesplit-possible-time-save settings='{"Comparison":"Personal Best","TotalTimeSave":true}'></livesplit-possible-time-save>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

| 設定 | 型 | 既定値 | 用途 |
| --- | --- | --- | --- |
| `Comparison` | 文字列 | Current Comparison | 比較対象 |
| `Display2Rows` | 真偽値 | false | trueで上下配置。既定は左右配置 |
| `TotalTimeSave` | 真偽値 | false | 残り全体の短縮可能時間を合計 |
| `Accuracy` | 文字列 | Hundredths | 表示精度 |
| `DropDecimals` | 真偽値 | false | 1分以上の値の小数を省略 |

TotalTimeSaveは待機中に全区間、走行中に残り区間を合計します。現在区間の経過に応じて減少し、完走後は0です。公式同様、合計では算出不能な区間を除外します。精度はSeconds / Tenths / Hundredths / Milliseconds。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="possible-time-save"`です。この専用タグの内側で使用してください。専用settingsと計算は汎用Valueでは実行されません。

## 動作・制限

比較値のない区間を跨ぐ場合はBest Segmentも合算します。単一区間表示は走行・一時停止中のみで、待機・完走時は「—」です。

[共通設定](../common.md) / [部品一覧](../README.md)
