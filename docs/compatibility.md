# 公式コンポーネントとの対応範囲

公式ソースの[コンポーネント一覧](https://github.com/LiveSplit/LiveSplit/tree/master/Components)と照合しています。グラフは対象外です。追加したパーツも含め、すべての公式設定・データを再現したものではありません。

| 公式の表示 | このプロジェクトでの対応 |
|---|---|
| Timer / Splits / Detailed Timer | 同名のパーツ。データ・設定の制限は各項目参照 |
| Current Comparison / Delta / Run Prediction / Sum of Best | `comparison` / `delta` / `current-pace` / `sum-of-best`。Sum of Bestの走行中再計算には制限あり |
| Comparison Time | 現在区間は`comparison-time`、最終比較は`final-time`。後者は完走後に実測値へ変わるため公式と完全同一ではない |
| Previous Segment / Possible Time Save | 区間差分・Live Segment・短縮可能時間の併記・残り合計に対応。[Possible Time Save](components/metrics/possible-time-save.md)・[Previous Segment](components/metrics/previous-segment.md)の設定参照 |
| Text / Hotkey Indicator | [部品一覧](components/README.md)のパーツ。TextはfieldまたはCustom Variable指定を利用 |
| Title / Blank Space / Separator | 既存のゲーム名・回数パーツ、HTML・CSSで構成できるため専用タグを追加しない |
| Total Playtime | 未実装。全Attempt履歴はv4では取得不可 |
| Counter | 内部カウンターはv4で公開されていないため未対応 |
| Subsplits | `livesplit-subsplits`。自動展開・折りたたみ、グループ時計と差分、見出しに対応 |
| World Record / Video | 未実装。外部ランキング連携や動画の同期・再生設定は別の実装が必要 |
| Auto Splitting / Manual Game Time / Sound / Racetime / TheRun等 | 表示専用WSパーツの対象外（操作・自動計測・音声・外部サービス連携） |

[目次](README.md)
