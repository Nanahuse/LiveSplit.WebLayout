# 対応範囲と移行

## 公式コンポーネントとの対応範囲

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

## 接続・配布形式の移行

- 旧Protobuf v3には対応していません。LiveSplit.BridgeもJSON Protocol v4対応版に更新します。独自HTMLの接続先が `/bridge/v3/rpc` なら `/bridge/v4/rpc` に変更してください。
- LiveSplit内蔵WebSocketへの接続・フォールバック・操作RPCはありません。LiveSplit.Bridgeを使用し、計測操作はLiveSplit側で行います。
- 従来の単一HTML配布から、HTML・`livesplit.js`・任意の `livesplit.css` を並べる構成に変更しています。相対パスを保って配置してください。
- 従来の `overlay=1` の代わりに、配布物の `timer.html` またはタイマーだけを配置したHTMLを使用します。

現在の手順は[導入ガイド](getting-started.md)、接続先の指定は[接続設定](connection.md)を参照してください。

## Splitsの旧列設定

互換性のため、`columns` 属性のJSON配列と小文字のキー（`name` / `type` / `comparison` / `timingMethod` / `width`）も受け付けます。`columns` 属性は `settings.Columns` より優先します。新しく設定する場合は[Splitsの列設定](components/splits/columns.md)の `settings.Columns` を使用してください。

旧 `comparisons="Personal Best|Best Segments"` は、比較ごとの比較累積タイム・差分とLiveTimeを組み合わせた従来の独自列セットを明示的に使う互換指定です。公式互換の列設定には使わず、`Columns` の各列でTypeとComparisonを指定します。設定なしの場合は比較名から列を自動生成せず、累積差分とSplit Timeの2列になります。

## 記録色の旧動作との差異

以前のPersonal Best固定判定と、Best Segment達成直後2秒間のタイマー強調は、公式の挙動と異なるため廃止しました。現在の全体タイマーは完走時の選択中比較でPB色を判定し、途中のBSでは切り替わりません。PBのレインボーはこのWeb版の拡張です。現在の設定・対象は[記録色と状態色](css/record-colors.md)を参照してください。

[目次](README.md)
