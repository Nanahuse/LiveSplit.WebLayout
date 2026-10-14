# 部品の共通設定

すべての部品は独立して配置でき、同じ接続先のRPC・Events接続を共有します。最後の部品を取り除くと接続を閉じます。

| 指定 | 対象・意味 |
|---|---|
| `server` | 各部品のBridge RPC接続先。[詳細](../connection.md) |
| `class` / `style` | 通常のCSSで見た目を設定 |
| `label` / `hide-label` | ラベル付き部品のラベル変更／非表示 |
| `layout="row"` | ラベル付き部品の既定テンプレートを左右配置。Hotkey Indicatorは対象外 |
| `settings` | 対応部品のみ。JSONで表示設定を指定。キーと型は各部品ページを参照 |
| `pb-effect` / `bs-effect` | 対象部品の記録色。[対応と判定](../css/record-colors.md) |

一般のラベル付き部品は上下配置が既定です。Possible Time Save・Previous Segmentは左右配置が既定で、`settings.Display2Rows`で上下配置にします。

```html
<livesplit-best-possible-time label="最速予測" layout="row"
  style="--ls-label-size:14px; --ls-value-size:24px"></livesplit-best-possible-time>
```

未取得・未設定の数値は原則「—」です。待機中や欠損時の扱いは部品によって異なります。接続状態は`data-state="connecting|connected|disconnected|error"`、通信不要の固定Textは`static`になります。これらは出力属性なので、CSSの選択条件として利用してください。

[共通CSS](../css/common.md) / [独自HTML](custom-markup.md) / [部品一覧](README.md)
