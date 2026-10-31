# Timer

現在の計測方法による全体タイマーです。

## 最小使用例

```html
<livesplit-timer></livesplit-timer>
```

## カスタマイズ例

```html
<livesplit-timer pb-effect="rainbow"
  style="--ls-timer-size:96px; --ls-decimal-size:.45em"></livesplit-timer>
```

## 属性・settings

`pb-effect` / `bs-effect` と `server` などは[共通設定](../common.md)を参照してください。Timerに `label` やDetailed Timer用の `settings` は適用されません。

## CSS・独自HTML

| 変数・対象 | 用途 |
|---|---|
| `--ls-timer-size` | 全体の大きさ。既定5rem |
| `--ls-decimal-size` | 小数の大きさ。既定.52em |
| `--ls-time-font` | 時計フォント。既定Consolas, monospace |
| `--ls-accent` / `--ls-muted` | 基本色／切断中の色。状態色・記録色が優先 |
| `.ls-timer` / `.ls-fraction` | 既定テンプレートの時計／小数 |

独自HTMLは[テンプレート](../custom-markup.md)を参照してください。

## 動作・制限

完走時の選択中比較との判定でPB色になります。途中のBSでは切り替わりません。[状態色・記録色の設定](../../css/record-colors.md)を参照してください。

最低桁数・表示精度を設定したい場合は[Detailed Timer](detailed-timer.md)を使用してください。

[共通設定](../common.md) / [部品一覧](../README.md)
