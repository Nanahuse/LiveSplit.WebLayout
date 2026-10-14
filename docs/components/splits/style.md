# Splits：枠・列幅・余白

全体の幅と装飾はCSS変数、各数値列の幅は`Columns`の`Width`（または`columns`の`width`）で指定できます。`Width`はこのWeb版の追加設定です。

```html
<style>
  .compact-splits {
    --ls-splits-width: 480px;
    --ls-table-layout: fixed;
    --ls-frame-width: 1px;
    --ls-frame-radius: 6px;
    --ls-border: #ffffff40;
    --ls-cell-padding-x: 10px;
    --ls-cell-padding-y: 4px;
    --ls-row-height: 32px;
  }
</style>
<livesplit-splits class="compact-splits" settings='{"Columns":[
  {"Name":"+/-","Type":"Delta","Width":"7ch"},
  {"Name":"Time","Type":"Split Time","Width":"9ch"}
]}'></livesplit-splits>
```

この例では数値列を指定幅にして区間名に残りの幅を割り当てます。`Width`は数値ならpx、文字列なら`px` / `em` / `rem` / `ch` / `%` / `auto`。列幅を削除すると自動幅に戻ります。

| CSS変数 | 用途・既定値 |
|---|---|
| `--ls-splits-width` | 枠全体の幅。100%。親の幅を上限にする |
| `--ls-table-layout` | auto（内容に応じて調整） / fixed（列幅を優先）。厳密な列割り当てはfixedを指定 |
| `--ls-name-width` | 区間名列の幅。auto |
| `--ls-column-width` | Width未指定の数値列の共通幅。auto |
| `--ls-cell-padding-x` / `--ls-cell-padding-y` | セル内の横・縦余白。各0.65em |
| `--ls-row-height` | 行の高さ。auto。長い区間名や余白で必要な場合は拡大 |
| `--ls-frame-width` / `--ls-frame-radius` | 外枠の線幅・角丸。各0px |
| `--ls-line-width` / `--ls-last-line-width` | 区間の罫線・最終区間前の線幅。1px / 2px |
| `--ls-splits-max-height` | 枠の高さ上限。none。超過時はスクロール |
| `--ls-table-min-width` | 表の最小幅。0px。枠より広い場合は横スクロール |

狭い固定幅では数値が省略されるため、必要に応じて列幅または表の最小幅を広げてください。2行表示では区間名は1行目全幅、数値列のWidthは2行目に適用します。`ShowThinSeparators: false`は罫線の幅指定より優先されます。

`--ls-blank-height`は空行の高さ（既定2.6em）。現在行は`.active`、最終行は`.last-split`、空行は`.split-blank`、区間番号は`.split-number`です。差分セルの`data-sign="ahead|behind"`は`--ls-ahead` / `--ls-behind`で装飾できます。

[記録色](../../css/record-colors.md) / [Splits目次](README.md)
