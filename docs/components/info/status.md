# Status

接続状態を表示します。

## 最小使用例

```html
<livesplit-status></livesplit-status>
```

## カスタマイズ例

```html
<livesplit-status style="--ls-color:#aaa; font-size:12px"></livesplit-status>
```

## 属性・settings

この部品固有の属性・settingsはありません。`server` は[共通設定](../common.md)を参照してください。

## CSS・独自HTML

```css
livesplit-status[data-state="connected"] { --ls-color: #67e8b0; }
livesplit-status[data-state="error"] { --ls-color: #efad9d; }
```

ラベル付き部品ではないため、文字サイズは通常の`font-size`を使います。独自HTMLの更新先は`data-ls-field="status"`です。

## 動作・制限

「接続中」「接続済み」「再接続待ち」、必要に応じてエラーの説明を表示します。状態は部品の`data-state`にも反映されます。

状態ごとの対処は[トラブルシューティング](../../troubleshooting.md)を参照してください。

[共通設定](../common.md) / [部品一覧](../README.md)
