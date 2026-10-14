# Value

任意の表示値をラベルなしで配置します。`field`省略時は`phase`です。

```html
<livesplit-value field="best-possible" style="font-size:32px"></livesplit-value>
```

## field一覧

| field | 内容 |
| --- | --- |
| `time`, `whole`, `fraction` | 現在タイム全体・整数部・小数部 |
| `game`, `category`, `phase` | ゲーム名・カテゴリ・走行状態 |
| `method`, `comparison` | 計測方法・比較名 |
| `delta`, `best-possible`, `final-time`, `final-label` | 比較差・最速完走予測・最終タイム・その説明 |
| `current-split`, `previous-split`, `split-progress` | 現在区間・直前区間・進捗 |
| `split-target`, `last-split` | 現在区間の比較累積タイム・直前の実測累積タイム |
| `attempts`, `completed` | 挑戦・完走回数 |
| `status`, `endpoint`, `split-note`, `readout-note` | 接続状態・接続先・補足説明 |

| 追加field | 内容 |
|---|---|
| `segment-time` | 現在区間の経過時間 |
| `previous-segment-time` | 直前区間の実測時間 |
| `live-segment-delta` | 現在区間の比較差分 |
| `current-pace` / `sum-of-best` | 完走予測／Best Segments比較の最終値 |
| `real-time` / `game-time` | 各計測方式の時計 |
| `hotkey-status` | 現状は取得不可 |

`possible-time-save` / `previous-segment-delta`の計算・設定反映には、それぞれ[Possible Time Save](../metrics/possible-time-save.md) / [Previous Segment](../metrics/previous-segment.md)の専用タグを使ってください。汎用Valueにfieldだけを指定しても専用の描画処理は実行されません。

## CSS・独自HTML

共通CSS変数と通常の`font-size`を使います。既定テンプレートの対象は`[data-ls-value]`です。ラベル付き部品専用の`--ls-value-size`は直接適用されません。

```css
livesplit-value [data-ls-value] { font-size: 24px; }
```

独自HTMLには`<span data-ls-value></span>`を置くと、field属性の変更に追従します。任意の固定フィールドには`data-ls-field`も使用できます。

[共通設定](../common.md) / [部品一覧](../README.md)
