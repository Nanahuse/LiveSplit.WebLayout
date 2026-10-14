# Status

接続状態を表示します。

```html
<livesplit-status style="--ls-color:#aaa; font-size:12px"></livesplit-status>
```

「接続中」「接続済み」「再接続待ち」、必要に応じてエラーの説明を表示します。状態は部品の`data-state`にも反映されます。

```css
livesplit-status[data-state="connected"] { --ls-color: #67e8b0; }
livesplit-status[data-state="error"] { --ls-color: #efad9d; }
```

ラベル付き部品ではないため、文字サイズは通常の`font-size`を使います。独自HTMLの更新先は`data-ls-field="status"`です。

[共通設定](../common.md) / [部品一覧](../README.md)
