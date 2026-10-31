# 共通CSS変数

付属の `livesplit.css` で使える変数のリファレンスです。CSSを適用する基本操作は[カスタマイズ](../customization.md)、読み込み順は[CSS設定](README.md)を参照してください。

## 枠・背景・配置

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `--ls-width` / `--ls-max-width` / `--ls-height` | auto / 100% / auto | 部品の幅・最大幅・高さ |
| `--ls-padding` | 0 | 内側の余白 |
| `--ls-background` | transparent | 背景。CSSグラデーションも使用可能 |
| `--ls-frame-width` / `--ls-frame-radius` | 0px / 0px | 外枠の線幅・角丸 |
| `--ls-border` | transparent（Splits / Subsplitsは #ffffff20） | 枠・罫線の色 |
| `--ls-align` / `--ls-line-height` | inherit / normal | 文字揃え・行の高さ |

高さを指定しても内容は自動で切り取られません。切り取りやスクロールが必要なら `overflow` も指定してください。Splits / Subsplitsの全体幅には専用の `--ls-splits-width` を使います。専用の幅・枠・スクロールは[Splitsの装飾](../components/splits/style.md)を参照してください。

## 共通の文字と色

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `--ls-color` / `--ls-font` | inherit | 部品の文字色・フォントファミリー |
| `--ls-time-font` | Consolas, monospace | 時計・時間値のフォントファミリー |
| `--ls-muted` | #82919f | 切断時やラベルなどの補助色 |
| `--ls-accent` | #67e8b0 | Timerの基本色・Splitsの現在行の文字色 |
| `--ls-active-background` | #234238 | Splits / Subsplitsの現在行の背景 |
| `--ls-ahead` / `--ls-behind` | #67e8b0 / #efad9d | 差分の先行・遅延色。通常の値の色より優先 |

Timerの状態色・PB・BSの色は[記録色と状態色](record-colors.md)を参照してください。状態によっては上記の基本色より優先されます。

## ラベル付き部品

Best Possible Time、Delta、区間時計、ペース、Sum of Best、回数、走行状態などに適用します。

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `--ls-label-size` / `--ls-label-font` | .75rem / inherit | ラベルの文字サイズ・フォントファミリー |
| `--ls-label-color` | --ls-muted（#82919f） | ラベルの色 |
| `--ls-value-size` / `--ls-value-font` | 1.5rem / --ls-time-font | 値の文字サイズ・フォントファミリー |
| `--ls-value-color` | inherit | 値の通常色。差分の先行・遅延色が優先 |
| `--ls-label-gap` | 上下配置 .4em / 左右配置 1em | ラベルと値の間隔 |
| `--ls-value-align` | right | 左右配置の値の文字揃え |
| `--ls-value-position` | flex-end | `layout="row"` でラベルを隠したときの値の配置 |

`label` / `hide-label` でラベルを変更・非表示にし、`layout="row"` で左右配置にします。通常は上下配置ですが、Possible Time Save・Previous Segmentは左右配置が既定です。この2つは `settings.Display2Rows` で上下配置にします。Hotkey Indicatorは `layout="row"` の対象外です。

ラベルと値の配置は既定テンプレートに対応します。独自HTMLでは通常のCSSで配置してください。

## 部品固有の変数

| パーツ | 主な調整方法・詳細 |
| --- | --- |
| [Timer](../components/timers/timer.md) | `--ls-timer-size` / `--ls-decimal-size` / `--ls-time-font` / `--ls-accent`。切断時は `--ls-muted` |
| [Detailed Timer](../components/timers/detailed-timer.md) | 時計設定に加え `--ls-segment-size` / `--ls-segment-ratio` / `--ls-segment-color` / `--ls-segment-decimal-size`。区間名は `--ls-segment-name-size` / `--ls-segment-name-color` |
| Detailed Timerの比較欄 | `--ls-comparison-label-font` / `--ls-comparison-label-color`、`--ls-comparison-value-size` / `--ls-comparison-value-color`、上部間隔 `--ls-comparison-gap`、左右間隔 `--ls-content-gap` |
| [Game](../components/info/game.md) | `--ls-game-size` / `--ls-game-weight` / `--ls-game-color`、`--ls-category-size` / `--ls-category-color` / `--ls-category-opacity`。個別非表示は `.ls-game` / `.ls-category` に `display:none` |
| [Text](../components/info/text.md) | 左右の色・フォント変数と `--ls-content-gap`。2行表示は `settings.Display2Rows` |
| [Hotkey Indicator](../components/info/hotkey-indicator.md) | `--ls-hotkey-height` / `--ls-hotkey-width` / `--ls-hotkey-on` / `--ls-hotkey-off` / `--ls-hotkey-unknown`。`show-text` で状態文字も表示 |
| [Status](../components/info/status.md) / [Value](../components/info/value.md) | 共通変数と通常のCSS。汎用Valueは内側の `[data-ls-value]` で文字サイズなどを指定 |

Detailed TimerとHotkey Indicatorの見た目は **公開CSS変数 → settings → 既定値** の順で優先します。再接続や属性変更で利用者のCSS変数を上書きしません。`--ls-setting-*` は内部用です。

## クラスごとに装飾する例

```html
<style>
  .metric-card {
    --ls-width: 320px;
    --ls-padding: 8px 12px;
    --ls-background: #15202b;
    --ls-frame-width: 1px;
    --ls-border: #ffffff30;
    --ls-frame-radius: 6px;
    --ls-label-size: 14px;
    --ls-value-size: 24px;
    --ls-label-gap: 16px;
  }
  .small-timer { --ls-timer-size: 64px; --ls-decimal-size: .45em; --ls-align: right; }
</style>
<livesplit-best-possible-time class="metric-card" layout="row" label="最速予測"></livesplit-best-possible-time>
<livesplit-timer class="small-timer"></livesplit-timer>
```

同じ種類の部品でもclassを分ければ別々に装飾できます。通常のCSSでセルなどの内部要素も指定できます。

```css
body { background: transparent; }
livesplit-splits { --ls-active-background: #345; --ls-ahead: lime; }
livesplit-splits th, livesplit-splits td { padding: 4px 12px; }
```

接続状態の出力属性 `data-state="connecting|connected|disconnected|error"` もCSSの選択条件に使えます。固定Textは `static` です。詳しくは[接続設定](../connection.md)を参照してください。

[CSS目次](README.md) / [部品一覧](../components/README.md)
