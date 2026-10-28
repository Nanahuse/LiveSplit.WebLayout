# Hotkey Indicator

Bridge v4はホットキー有効状態を公開していないため、現状は未知色の線と「取得不可」を表示します。状態の操作は行いません。

```html
<livesplit-hotkey-indicator show-text label="Hotkeys"
  settings='{"IndicatorHeight":5}'></livesplit-hotkey-indicator>
```

| 指定 | 既定値・用途 |
|---|---|
| `orientation="vertical"` | 省略時は横線。指定すると縦線 |
| `show-text` | 省略時は状態文字を視覚的に隠す |
| `settings.IndicatorHeight` / `IndicatorWidth` | 3。横線の高さ／縦線の幅（px） |
| `settings.HotkeysOnColor` / `HotkeysOffColor` | #29cc54 / #cc3729。現在は状態不明のため適用されない |

## CSS

| 変数・対象 | 用途 |
|---|---|
| `--ls-hotkey-height` / `--ls-hotkey-width` | settingsより優先する寸法 |
| `--ls-hotkey-on` / `--ls-hotkey-off` / `--ls-hotkey-unknown` | 有効／無効／未知色。未知色は--ls-muted、既定#82919f |
| `.ls-hotkey-bar` | 線の要素。data-hotkeysはon / off / unknown |

独自HTMLでは`.ls-hotkey-bar`と`data-ls-field="hotkey-status"`を使います。`layout="row"`は対象外です。

[共通設定](../common.md) / [部品一覧](../README.md)
