# 共通の枠・文字・配置

共通で`--ls-width` / `--ls-max-width` / `--ls-height`、`--ls-padding`、`--ls-background`、`--ls-frame-width` / `--ls-frame-radius` / `--ls-border`、`--ls-align` / `--ls-line-height`を指定できます。Splits全体の幅は専用の`--ls-splits-width`を使用します。背景はCSSグラデーションにも対応します。高さは内容を切り取らないため、切り取りやスクロールが必要なら`overflow`も指定してください。

| パーツ | 調整方法 |
|---|---|
| Best Possible Time、Delta、区間時計、ペース、Sum of Best、回数、状態などのラベル付きパーツ | `label` / `hide-label`。`layout="row"`で左右配置、未指定で上下配置。`--ls-label-gap`で間隔 |
| ラベルと値 | `--ls-label-size` / `--ls-label-font` / `--ls-label-color`、`--ls-value-size` / `--ls-value-font` / `--ls-value-color`。差分の先行・遅延色は`--ls-ahead` / `--ls-behind`が優先 |
| Timer | `--ls-timer-size` / `--ls-decimal-size` / `--ls-time-font` / `--ls-accent`。切断時は`--ls-muted` |
| Detailed Timer | 上記時計設定に加えて`--ls-segment-size` / `--ls-segment-ratio` / `--ls-segment-color` / `--ls-segment-decimal-size`。区間名は`--ls-segment-name-size` / `--ls-segment-name-color` |
| Detailed Timerの比較欄 | `--ls-comparison-label-font` / `--ls-comparison-label-color`、`--ls-comparison-value-size` / `--ls-comparison-value-color`、上部間隔`--ls-comparison-gap`、左右間隔`--ls-content-gap` |
| Game | `--ls-game-size` / `--ls-game-weight` / `--ls-game-color`、`--ls-category-size` / `--ls-category-color` / `--ls-category-opacity`。個別非表示は`.ls-game` / `.ls-category`へ`display:none` |
| Text | 左右の色・フォント変数と`--ls-content-gap`。2行表示は`settings.Display2Rows` |
| Hotkey Indicator | `--ls-hotkey-height` / `--ls-hotkey-width` / `--ls-hotkey-on` / `--ls-hotkey-off` / `--ls-hotkey-unknown`。`show-text`で状態文字も表示 |
| Status / 汎用Value | 共通変数と通常のCSS。汎用Valueは内側の`[data-ls-value]`で文字サイズなどを指定 |

Detailed TimerとHotkey Indicatorの見た目は **公開CSS変数 → settings → 既定値** の順で優先します。再接続や属性変更で利用者のCSS変数を上書きしません。`--ls-setting-*`は内部用です。

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

`layout="row"`はラベル付きパーツ専用で、Hotkey Indicatorは対象外です。個別パーツへクラスを付ければ同じ種類でも別々に装飾できます。ラベル・値の左右配置は既定テンプレートに対応し、独自HTMLでは通常のCSSで配置してください。

Shadow DOMを使わないため、通常のCSSセレクターですべて装飾できます。付属CSSはパーツ内のみを対象とし、bodyの背景・配置・余白を指定しません。

```html
<style>
  body { background: transparent; }
  livesplit-timer { --ls-timer-size: 96px; --ls-accent: white; }
  livesplit-splits { --ls-active-background: #345; --ls-ahead: lime; }
  livesplit-splits th, livesplit-splits td { padding: 4px 12px; }
</style>
```

主なCSS変数は `--ls-color`, `--ls-font`, `--ls-time-font`, `--ls-timer-size`, `--ls-accent`, `--ls-muted`, `--ls-border`, `--ls-active-background`, `--ls-ahead`, `--ls-behind` です。接続状態は各タグの `data-state="connecting|connected|disconnected|error"` に反映されます。



`--ls-value-align`は横並び時の値の文字揃え（既定right）、`--ls-value-position`は横並びでラベルを隠したときの値の配置（既定flex-end）です。

## 共通変数の既定値

| 変数 | 既定値 |
|---|---|
| `--ls-width` / `--ls-max-width` / `--ls-height` | auto / 100% / auto |
| `--ls-padding` / `--ls-background` | 0 / transparent |
| `--ls-frame-width` / `--ls-frame-radius` | 0px / 0px |
| `--ls-color` / `--ls-font` / `--ls-align` | inherit |
| `--ls-line-height` | normal |
| `--ls-muted` | #82919f |

Splitsは専用の幅・枠のスタイルを持ちます。[Splitsの装飾](../components/splits/style.md)を参照してください。

[CSS目次](README.md)
