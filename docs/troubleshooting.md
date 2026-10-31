# トラブルシューティング

まず配布物の `dist/index.html` で表示を確認すると、自分のHTMLによる問題か、接続・導入の問題かを切り分けられます。

## 部品が表示されない・文字だけになる

1. HTMLと同じフォルダーに `livesplit.js` を置き、`<script defer src="./livesplit.js"></script>` のパスを確認します。
2. 装飾がない場合は `livesplit.css` の配置と `<link rel="stylesheet" href="./livesplit.css">` を確認します。CSSを省略すると付属の配置・装飾は適用されません。
3. タグの綴りを[コンポーネント一覧](components/README.md)と照合し、部品同士の入れ子を解消します。
4. タグ内に子要素を置いた場合は既定テンプレートが生成されません。まず子要素なしで試すか、[独自HTMLの更新対象](components/custom-markup.md)を確認します。

開発用のルート `index.html` を直接開いている場合は、配布ZIP内の `dist/index.html` を使ってください。ソースからの利用は[開発・検証](development.md)を参照してください。

## 接続できない・タイマーが動かない

接続を確認したい部品と同じ `server` の `<livesplit-status>` を追加します。

```html
<livesplit-timer server="ws://127.0.0.1:54000/bridge/v4/rpc"></livesplit-timer>
<livesplit-status server="ws://127.0.0.1:54000/bridge/v4/rpc"></livesplit-status>
```

- 「接続中」「再接続待ち」: LiveSplitの現在のレイアウトにBridgeが追加され、Bridgeの設定が `Status: Running` になっているか確認します。JSON Protocol v4・ローカルファイル接続に対応したBridgeが必要です。
- Bridgeが `Status: Failed` の場合: 設定画面のエラーを確認します。ポートが使用中なら別のポートに変更して `Apply` を押し、HTML側も同じポートにします。LiveSplitのレイアウトも保存してください。
- 接続先: ホスト・ポート・`/bridge/v4/rpc` を確認します。Eventsの `/bridge/v4/events` にも同じポートで接続できる必要があります。Bridgeは同じPCからの接続専用なので、ブラウザー・OBSもLiveSplitと同じPCで起動します。
- 接続の優先順位: 各部品の `server`、ページURLの `?server=…`、既定値の順です。別の接続先を指定した部品が混在していないか確認します。
- 「接続済み」なのに時計が止まる: LiveSplit側の待機・一時停止・完走状態、選択中の計測方法を確認します。Game Timeだけを一時停止している場合、その時計は進みません。

切断後は自動で再接続します。時計や表示データは再取得されます。詳細は[接続設定](connection.md)を参照してください。

## 「設定エラー」が表示される

表示された項目名を手掛かりに、該当部品の設定表を確認します。

- `settings` はJSONオブジェクトです。HTML属性をシングルクォート、JSONのキー・文字列をダブルクォートで囲み、末尾の余分なカンマを除きます。
- 数値・真偽値の型を確認します。例: `"VisualSplitCount":6`、`"ShowColumnLabels":true`。
- 設定名は大文字・小文字を区別します。他の部品の設定やLiveSplit本体の全設定をそのまま渡すことはできません。
- 接続先は `ws://` または `wss://` のBridge v4 RPC URLにします。URL内のクエリなどは使えません。
- Splitsの `Columns` は0〜32列の配列です。[列設定](components/splits/columns.md)でType・TimingMethodを確認します。

## 「—」や空欄になる

接続済みでも、元データが未設定の場合や表示条件を満たさない場合があります。

| 症状 | 確認すること |
| --- | --- |
| Game Timeが「—」 | LiveSplitでGame Timeが初期化・設定されているか。Real Timeには自動で置き換えません |
| 比較タイム・差分が「—」 | 選択した計測方法の比較値・実測値があるか。スキップで確定値がない区間も「—」になります |
| Splitsの現在・未到達行の差分が空欄 | Delta / Segment Deltaはライブ差分の表示条件が成立するまで空欄です |
| Possible Time Saveが「—」 | 単一区間表示は走行・一時停止中のみ。待機・完走中は「—」です |
| Custom Variableが出ない | 変数名の大文字・小文字・空白まで一致しているか。Textの未設定値は「—」、Splits列の未設定値は空欄です |
| Hotkey Indicatorが「取得不可」 | Bridge v4でホットキー状態が公開されていないため、現状の制限です |

汎用Valueでは専用部品の計算が動かない項目があります。短縮可能時間や直前区間の差分は、[Possible Time Save](components/metrics/possible-time-save.md)・[Previous Segment](components/metrics/previous-segment.md)の専用タグを使ってください。

## 属性・CSSの変更が反映されない

1. 編集したHTMLを保存し、ブラウザーやOBSのブラウザソースを再読み込みします。読み込んでいるHTMLのパスも確認します。
2. 独自CSSを `livesplit.css` の後に読み込みます。同じ部品を個別に装飾する場合はclassを付けます。
3. 対象部品に対応した変数か確認します。Timerは `--ls-timer-size`、ラベル付きの値は `--ls-value-size`、Splits全体の幅は `--ls-splits-width` です。
4. Detailed Timer・Hotkey Indicatorの見た目は公開CSS変数 → settings → 既定値の順です。差分色・記録色・状態色が通常色に優先する場合もあります。
5. `label`・`layout="row"` は対応部品にのみ適用されます。独自HTMLでは配置を自分のCSSで指定します。

[カスタマイズ](customization.md)・[共通CSS](css/common.md)・各部品の設定表を参照してください。

## OBSで切れる・背景が透過しない

ブラウザソースの幅・高さを内容に合わせます。全体の幅を設定しても高さは内容に応じて変わるため、ソース内に収まるか確認してください。透過タイマーは `timer.html` を使えます。独自HTMLでは `body { margin: 0; background: transparent; }` を指定し、部品の背景も確認します。付属CSSはbodyの背景・余白を指定しません。

[導入ガイド](getting-started.md) / [接続設定](connection.md) / [対応範囲と移行](compatibility.md) / [目次](README.md)
