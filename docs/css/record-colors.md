# PB・Best Segment・状態色

Timer、Detailed Timer、区間タイマー、直前区間タイム、Splitsの確定した差分セルに記録更新の色を適用できます。`pb-effect` / `bs-effect`をそれぞれ`color`（既定）、`rainbow`、`none`から選択します。判定値はLiveSplitから取得し、表示パーツごとに効果を指定できます。

```html
<livesplit-timer pb-effect="rainbow" bs-effect="none"></livesplit-timer>
<livesplit-detailed-timer pb-effect="rainbow" bs-effect="color"
  style="--ls-bs-color: #ffd700; --ls-rainbow-duration: 3.6s"></livesplit-detailed-timer>
<livesplit-previous-segment bs-effect="rainbow"></livesplit-previous-segment>
<livesplit-splits bs-effect="rainbow"></livesplit-splits>
```

指定色は`--ls-pb-color`（既定青 `#16a6ff`）・`--ls-bs-color`（既定金 `#ffd700`）、レインボーの周期は`--ls-rainbow-duration`（既定3.6s）です。色相を一巡させる表現は公式の[GetBestSegmentColor](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Model/LiveSplitStateHelper.cs)を参考に、CSSで滑らかに変化させています。OSで動きを減らす設定が有効な場合は指定色に固定します。

| 対象 | 記録色のタイミング |
|---|---|
| 全体タイマー（Detailed Timer内も含む） | 完走時に選択中比較より速い、または比較タイムが未設定ならPB色。途中のBS達成では色を変えない |
| 現在区間タイマー | 公式Detailed TimerのSegmentTimerと同様、全体タイマーと同じ状態色・完走判定を使用 |
| 直前区間タイム | 直前の確定区間がBSなら次の区間確定まで維持 |
| Splits | BSを達成した完了行の差分セルを強調。通常の時間列とCustom Variable列は対象外 |

TimerのPB色は完走時の選択中比較とAttemptの最終実測値から判定します。同タイムはPB色にしません。BSは個別Best Segmentの未設定・更新、またはBest Segmentsに対する区間差分が負の場合に判定します。

PBのレインボーはこのWeb版の拡張です。以前のPersonal Best固定判定とBS直後2秒間のタイマー強調は、公式の挙動と異なるため廃止しました。リセット・切断・不整合な取得状態では効果を解除します。`data-record="pb|bs"`と`data-record-effect`で独自のCSS効果にも差し替えられます。

Timerの状態色は公式の優先順位（待機／負の時計 → ポーズ → 完走 → 走行中）に従います。走行中は現在累積差分の正負と直前差分から先行・遅延／回復・悪化を判定します。色は`--ls-not-running-color`、`--ls-paused-color`、`--ls-ahead-gaining-color`、`--ls-ahead-losing-color`、`--ls-behind-gaining-color`、`--ls-behind-losing-color`で変更できます。イベント直後はAttempt取得が完了するまで記録色の反映を保留します。

[CSS目次](README.md)
