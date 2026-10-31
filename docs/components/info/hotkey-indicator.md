# Hotkey Indicator

ホットキーの有効状態を線で表す部品です。Bridge v4では状態を取得できないため、現在は未知色で表示します。

## 最小使用例

```html
<livesplit-hotkey-indicator></livesplit-hotkey-indicator>
```

## カスタマイズ例

```html
<livesplit-hotkey-indicator show-text label="Hotkeys"
  settings='{"IndicatorHeight":5}'></livesplit-hotkey-indicator>
```

## 属性・settings

| 指定 | 型 | 省略時・既定値 | 用途 |
| --- | --- | --- | --- |
| `orientation="vertical"` | 文字列属性 | 横線 | verticalで縦線 |
| `show-text` | 有無で指定する属性 | 文字を視覚的に隠す | ラベルと状態文字を表示 |
| `settings.IndicatorHeight` / `IndicatorWidth` | 数値 | 3 | 横線の高さ／縦線の幅（px）。0〜1000 |
| `settings.HotkeysOnColor` / `HotkeysOffColor` | 文字列 | #29cc54 / #cc3729 | 現在は状態不明のため適用されない |

ラベルの変更・非表示と接続先は[共通設定](../common.md)を参照してください。

## CSS・独自HTML

| 変数・対象 | 用途 |
|---|---|
| `--ls-hotkey-height` / `--ls-hotkey-width` | settingsより優先する寸法 |
| `--ls-hotkey-on` / `--ls-hotkey-off` / `--ls-hotkey-unknown` | 有効／無効／未知色。未知色は--ls-muted、既定#82919f |
| `.ls-hotkey-bar` | 線の要素。data-hotkeysはon / off / unknown |

独自HTMLでは`.ls-hotkey-bar`と`data-ls-field="hotkey-status"`を使います。`layout="row"`は対象外です。

## 動作・制限

Bridge v4はホットキー有効状態を公開していないため、現状は未知色の線と「取得不可」を表示します。状態の操作は行いません。

[共通設定](../common.md) / [部品一覧](../README.md)
