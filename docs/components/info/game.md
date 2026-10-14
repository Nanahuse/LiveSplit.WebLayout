# Game

ゲーム名とカテゴリを表示します。

```html
<livesplit-game style="--ls-game-size:28px; --ls-category-size:16px"></livesplit-game>
```

## CSS

| 変数・対象 | 用途 |
|---|---|
| `--ls-game-size` / `--ls-game-weight` / `--ls-game-color` | ゲーム名。既定1.5em / 700 / inherit |
| `--ls-category-size` / `--ls-category-color` / `--ls-category-opacity` | カテゴリ。既定1em / inherit / .7 |
| `.ls-game` / `.ls-category` | ゲーム名／カテゴリ。個別にdisplay:noneで非表示 |

独自HTMLは`data-ls-field="game"` / `data-ls-field="category"`を使用します。単独表示なら[Value](value.md)も使えます。

[共通設定](../common.md) / [部品一覧](../README.md)
