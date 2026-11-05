# PB・Best Segment・状態色

Timer、Detailed Timer、区間タイマー、直前区間タイム、Splitsの確定した差分セルに記録更新の色を適用できます。`pb-effect` / `bs-effect`をそれぞれ`color`（既定）、`rainbow`、`none`から選択します。判定値はLiveSplitから取得し、表示パーツごとに効果を指定できます。

```html
<livesplit-timer pb-effect="rainbow" bs-effect="none"></livesplit-timer>
<livesplit-detailed-timer pb-effect="rainbow" bs-effect="color"
  style="--ls-bs-color: #ffd700; --ls-rainbow-duration: 3.6s"></livesplit-detailed-timer>
<livesplit-previous-segment bs-effect="rainbow"></livesplit-previous-segment>
<livesplit-splits bs-effect="rainbow"></livesplit-splits>
```

## 色と効果

| 指定 | 型 | 既定値 | 用途 |
| --- | --- | --- | --- |
| `pb-effect` / `bs-effect` | 属性の文字列 | color | `color` / `rainbow` / `none` から選択 |
| `--ls-pb-color` | CSSの色 | #16a6ff | PBの指定色（青） |
| `--ls-bs-color` | CSSの色 | #ffd700 | Best Segmentの指定色（金） |
| `--ls-rainbow-duration` | CSSの時間 | 3.6s | レインボーの周期 |

OSで動きを減らす設定が有効な場合、レインボーは指定色に固定します。PBのレインボーはこのWeb版の拡張です。

## 判定と表示タイミング

| 対象 | 記録色のタイミング |
|---|---|
| 全体タイマー（Detailed Timer内も含む） | 完走時に選択中比較より速い、または比較タイムが未設定ならPB色。途中のBS達成では色を変えない |
| 現在区間タイマー | 公式Detailed TimerのSegmentTimerと同様、全体タイマーと同じ状態色・完走判定を使用 |
| 直前区間タイム | 直前の確定区間がBSなら次の区間確定まで維持 |
| Splits | BSを達成した完了行の差分セルを強調。通常の時間列とCustom Variable列は対象外 |

TimerのPB色は完走時の選択中比較とAttemptの最終実測値から判定します。同タイムはPB色にしません。BSは個別Best Segmentの未設定・更新、またはBest Segmentsに対する区間差分が負の場合に判定します。

リセット・切断・不整合な取得状態では効果を解除します。`data-record="pb|bs"`と`data-record-effect`で独自のCSS効果にも差し替えられます。

## タイマーの状態色

Timerの状態色は公式の優先順位（待機／負の時計 → ポーズ → 完走 → 走行中）に従います。走行中は現在累積差分の正負と直前差分から先行・遅延／回復・悪化を判定します。色は`--ls-not-running-color`、`--ls-paused-color`、`--ls-ahead-gaining-color`、`--ls-ahead-losing-color`、`--ls-behind-gaining-color`、`--ls-behind-losing-color`で変更できます。イベント直後はAttempt取得が完了するまで記録色の反映を保留します。

過去の記録色との差異は[対応範囲と移行](../compatibility.md)、実装の参照元は[開発・検証](../development.md)にまとめています。

[CSS目次](README.md)
