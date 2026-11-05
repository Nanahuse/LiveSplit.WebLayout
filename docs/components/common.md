# 部品の共通設定

すべての部品は独立して配置でき、同じ接続先のRPC・Events接続を共有します。最後の部品を取り除くと接続を閉じます。

## 共通属性

| 指定 | 型 | 省略時 | 対象・意味 |
| --- | --- | --- | --- |
| `server` | WebSocket URL文字列 | ページURLのserver、なければ既定のRPC URL | 各部品のBridge RPC接続先。[詳細](../connection.md) |
| `class` / `style` | HTMLの文字列 | 指定なし | 通常のCSSで見た目を設定 |
| `label` | 文字列 | 部品ごとのラベル（下表） | `.ls-label` のラベル変更 |
| `hide-label` | 有無で指定する属性 | ラベルを表示 | `.ls-label` を非表示。`hide-label="false"` でも存在すれば非表示 |
| `layout="row"` | 属性値row | 下記の既定配置 | ラベル付き部品の既定テンプレートを左右配置。Hotkey Indicatorは対象外 |
| `settings` | JSONオブジェクト文字列 | `{}`（部品の既定値を使用） | 対応部品のみ。キーと型は各部品ページを参照 |
| `pb-effect` / `bs-effect` | color / rainbow / none | color | 対象部品の記録色。[対応と判定](../css/record-colors.md) |

一般のラベル付き部品は上下配置が既定です。Possible Time Save・Previous Segmentは左右配置が既定で、`settings.Display2Rows`で上下配置にします。

`layout="row"` を明示すると `Display2Rows` より左右配置が優先されます。Timer・Game・Splits・Text・Status・Valueはラベル付き部品ではありません。Hotkey Indicatorのラベルと状態文字は `show-text` で表示します。

## ラベルの既定値

| 部品 | ラベル |
| --- | --- |
| Segment Timer / Previous Segment Time | 区間タイマー / 直前の区間タイム |
| Real Time / Game Time | Real Time / Game Time |
| Best Possible Time / Current Pace / Sum Of Best | Best Possible Time / Current Pace / Sum of Best |
| Delta / Live Segment | 比較との差 / 現在区間の差分 |
| Previous Split / Comparison Time | 直前の累積タイム / 現在区間の比較累積タイム |
| Final Time | 比較の最終タイム。完走後は「完走タイム」 |
| Possible Time Save | Possible Time Save。合計表示時は先頭にTotalを追加 |
| Previous Segment | Previous Segment。ライブ差分表示時はLive Segment |
| Current Split / Previous Split Name | 現在の区間 / 直前の区間 |
| Split Progress / Attempts / Completed Attempts | 区間進捗 / 挑戦回数 / 完走回数 |
| Phase / Comparison / Timing Method | 走行状態 / 比較対象 / 計測方法 |
| Hotkey Indicator | Global Hotkeys |

Possible Time Save・Previous Segmentで比較名を明示した場合は、既定ラベルに比較名を付記します。`label` 属性で指定した文字列は自動ラベルより優先されます。

## 配置例

```html
<livesplit-best-possible-time label="最速予測" layout="row"
  style="--ls-label-size:14px; --ls-value-size:24px"></livesplit-best-possible-time>
```

## 動作・制限

未取得・未設定の数値は原則「—」です。待機中や欠損時の扱いは部品によって異なります。接続状態は`data-state="connecting|connected|disconnected|error"`、通信不要の固定Textは`static`になります。これらは出力属性なので、CSSの選択条件として利用してください。

settingsのキーは大文字・小文字を区別します。数値・真偽値はJSONの数値・真偽値で渡してください。未対応の設定や不正な型を指定すると、設定エラーになる部品があります。[カスタマイズ](../customization.md)にJSONの記述例があります。

[共通CSS](../css/common.md) / [独自HTML](custom-markup.md) / [部品一覧](README.md)
