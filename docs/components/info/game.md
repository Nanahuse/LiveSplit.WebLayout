# Game

ゲーム名とカテゴリを表示します。

## 最小使用例

```html
<livesplit-game></livesplit-game>
```

## カスタマイズ例

```html
<livesplit-game style="--ls-game-size:28px; --ls-category-size:16px"></livesplit-game>
```

## 属性・settings

この部品固有の属性・settingsはありません。`server`・`class`・`style` は[共通設定](../common.md)を参照してください。

## CSS・独自HTML

| 変数・対象 | 用途 |
|---|---|
| `--ls-game-size` / `--ls-game-weight` / `--ls-game-color` | ゲーム名。既定1.5em / 700 / inherit |
| `--ls-category-size` / `--ls-category-color` / `--ls-category-opacity` | カテゴリ。既定1em / inherit / .7 |
| `.ls-game` / `.ls-category` | ゲーム名／カテゴリ。個別にdisplay:noneで非表示 |

独自HTMLは`data-ls-field="game"` / `data-ls-field="category"`を使用します。単独表示なら[Value](value.md)も使えます。

## 動作・制限

ゲーム名・カテゴリはLiveSplit側のRun情報に従います。未取得の共通動作は[共通設定](../common.md)を参照してください。

[共通設定](../common.md) / [部品一覧](../README.md)
