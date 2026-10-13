# LiveSplit.WebLayout

LiveSplit.Bridge Protocol v3を使う表示専用HTMLパーツ集です。TypeScript + Viteで開発し、利用時のNode.js・npmは不要です。配布物はlocalhostの静的HTTPサーバーから提供します。LiveSplit内蔵WebSocketへの接続・フォールバック・操作RPCはありません。

## ビルドと配布

開発者のみNode.js 22.12以降が必要です。

```sh
npm ci
npm run build
```

`dist/` に次のファイルを出力します。

| ファイル | 用途 |
| --- | --- |
| `livesplit.js` | パーツを登録する通常のJavaScript。`type="module"`不要 |
| `livesplit.css` | 任意の初期スタイル。編集・差し替え・省略可能 |
| `index.html` | 全パーツの配置例。レイアウトやデザインはこのHTMLで編集 |
| `timer.html` | OBS向けの透過タイマーだけの配置例 |
| `serve.ps1` | Windows用loopback専用の静的HTTPサーバー |

LiveSplitにProtocol v3対応のLiveSplit.Bridgeを追加して起動してください。RPCの既定接続先は `ws://127.0.0.1:54000/bridge/v3/rpc`、Eventsは同じポートの `/bridge/v3/events` です。

Windowsでは配布したdistフォルダーで次を実行できます（Windows PowerShell標準機能のみ）。

```powershell
powershell -NoProfile -File .\serve.ps1
```

ブラウザー／OBSブラウザソースのURLには `http://127.0.0.1:8080/index.html` または `http://127.0.0.1:8080/timer.html` を指定します。別の静的HTTPサーバーも利用可能です。PowerShellスクリプトが組織ポリシー等で実行できない場合は許可された静的サーバーを使ってください。BridgeのOrigin制限のため **file://やOBSのローカルファイル指定は非対応** です。Origin制限は緩和しません。

配布物を編集しても再ビルドは不要です。ただし次のビルドで `dist/` は置き換わるため、自分のレイアウトは別フォルダーに保存してください。従来の単一HTML配布から変更しています。JS・CSSも一緒に配置してください。

## 好きなパーツを配置

```html
<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<link rel="stylesheet" href="./livesplit.css">
<script defer src="./livesplit.js"></script>

<livesplit-game></livesplit-game>
<livesplit-splits></livesplit-splits>
<livesplit-timer></livesplit-timer>
<p>比較との差 <livesplit-value field="delta"></livesplit-value></p>
<livesplit-status></livesplit-status>
</html>
```

| タグ | 表示内容 |
| --- | --- |
| `livesplit-timer` | 現在タイムと小数部 |
| `livesplit-game` | ゲーム名・カテゴリ |
| `livesplit-splits` | 区間名・比較差・累積タイムの表 |
| `livesplit-status` | 接続状態 |
| `livesplit-value field="…"` | 任意の単独項目 |

### 専用のUIコンポーネント

次のタグはラベルと値をセットで表示します。すべて独立配置・複製・`server`指定・独自HTMLの指定に対応し、既存の接続を共有します。

| タグ | 表示内容 |
| --- | --- |
| `livesplit-best-possible-time` | Best Possible Time（LiveSplitの最速完走予測） |
| `livesplit-delta` | 比較との差。先行・遅延で色分け |
| `livesplit-previous-split` | 直前に終了した区間の累積タイム（区間単体の所要時間ではありません） |
| `livesplit-comparison-time` | 現在区間の比較累積タイム |
| `livesplit-final-time` | 比較の最終タイム。終了後は完走タイムとそのラベルに切り替え |
| `livesplit-current-split` | 現在区間名 |
| `livesplit-previous-split-name` | 直前区間名 |
| `livesplit-split-progress` | 区間進捗 |
| `livesplit-attempts` | 挑戦回数 |
| `livesplit-completed-attempts` | 完走回数 |
| `livesplit-phase` | 待機中・計測中・一時停止・完走 |
| `livesplit-comparison` | 比較対象の名前 |
| `livesplit-timing-method` | Real Time / Game Time |

```html
<livesplit-best-possible-time label="最速完走予測"></livesplit-best-possible-time>
<livesplit-delta hide-label></livesplit-delta>
<livesplit-attempts label="Attempts"></livesplit-attempts>
```

`label`でラベルを変更、`hide-label`でラベルを非表示にできます。ラベル変更では通信を再接続しません。内部の `.ls-label` と `.ls-value` を通常のCSSで装飾でき、`--ls-label-size`（既定0.75rem）・`--ls-value-size`（既定1.5rem）も使えます。未取得や比較タイム未設定の場合は「—」です。専用タグを使っても、同等の`livesplit-value`を使っても数値の意味は変わりません。

不要なタグは削除し、自由に並べ替え・複製できます。同じ接続先のパーツは通信と走行履歴を共有します。最後のパーツを取り除くと接続を閉じます。独自のページ全体を書き換えたり、グローバルなIDに依存したりしません。

`field`に指定できる項目:

| field | 内容 |
| --- | --- |
| `time`, `whole`, `fraction` | 現在タイム全体・整数部・小数部 |
| `game`, `category`, `phase` | ゲーム名・カテゴリ・走行状態 |
| `method`, `comparison` | 計測方法・比較名 |
| `delta`, `best-possible`, `final-time`, `final-label` | 比較差・最速完走予測・最終タイム・その説明 |
| `current-split`, `previous-split`, `split-progress` | 現在区間・直前区間・進捗 |
| `split-target`, `last-split` | 現在区間の比較累積タイム・直前の実測累積タイム |
| `attempts`, `completed` | 挑戦・完走回数 |
| `status`, `endpoint`, `split-note`, `readout-note` | 接続状態・接続先・補足説明 |

## CSSと独自マークアップ

### 全パーツのカスタマイズ

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

タグ内に独自HTMLを記述すると、既定のマークアップを生成せず、`data-ls-field` の箇所だけ更新します。名前は上のfield一覧と共通です。パーツ同士は入れ子にせず並べて配置してください。

```html
<livesplit-timer>
  <strong data-ls-field="whole"></strong><small data-ls-field="fraction"></small>
</livesplit-timer>
```

Splits表を独自に組む場合は、`tbody data-ls-field="splits"` と、列見出し用の `thead` 内に `tr data-ls-field="split-head"` を設けてください。その行と見出しはパーツが管理します。行には `active`、差分セルには `data-sign="ahead|behind"` が付くのでCSSで装飾できます。

### Splitsの設定（公式のColumnsに対応）

設定なしの `<livesplit-splits>` は、本体既定の **+/−（Delta）とTime（Split Time）の2列**です。比較名から列を自動生成しません。Best Segmentsでも累積差分と区間差分のどちらを使うかは `Type` で指定します。

`settings` の `Columns` 配列が本体の列一覧に相当します。`Name`（列名）、`Type`（Column Type）、`Comparison`（比較対象）、`TimingMethod`（計測方法）を各列に指定してください。配列の編集で追加・削除・並べ替えができ、空配列なら区間名だけになります。画面上の操作パネルは追加せず、表示専用のHTML設定です。

```html
<livesplit-splits settings='{
  "VisualSplitCount": 8,
  "SplitPreviewCount": 1,
  "ShowColumnLabels": true,
  "Columns": [
    {"Name":"+/-","Type":"Delta","Comparison":"Current Comparison","TimingMethod":"Current Timing Method"},
    {"Name":"Best","Type":"Segment Delta","Comparison":"Best Segments","TimingMethod":"Current Timing Method"},
    {"Name":"Time","Type":"Split Time","Comparison":"Personal Best","TimingMethod":"Current Timing Method"}
  ]
}'></livesplit-splits>
```

`Type` は本体の表示名（`Split Time`、`Segment Delta or Segment Time`など）をそのまま使用できます。`Current Comparison` は本体で選択中の比較です。比較名は変更せず送信します。本体同様、区間系の列で `Best Split Times` を指定すると `Current Comparison` に戻します。

`TimingMethod` は `Current Timing Method` / `Real Time` / `Game Time`。Bridgeが両方式の比較・実測値を提供するため、各列で独立に指定できます。未設定のGame TimeはReal Timeに置き換えず「—」で表示します。

互換性のため従来の `columns` 配列と小文字のキーも受け付けます。`columns` 属性は `settings.Columns` より優先します。旧 `comparisons="Personal Best|Best Segments"` は従来の独自列セットを明示的に使う互換指定であり、公式互換の設定には使用しないでください。

| `type` | 本体のColumn Type | 現在・未完了区間 | 完了区間 |
|---|---|---|---|
| `SplitTime` | Split Time | 比較の累積タイム | 今回の累積タイム |
| `SegmentTime` | Segment Time | 比較の区間タイム | 今回の区間タイム |
| `Delta` | Delta | 条件成立後の累積差分 | 確定した累積差分 |
| `SegmentDelta` | Segment Delta | 条件成立後の区間差分 | 確定した区間差分 |
| `DeltaorSplitTime` | Delta or Split Time | 累積差分、未表示なら比較タイム | 累積差分、欠損なら今回のタイム |
| `SegmentDeltaorSegmentTime` | Segment Delta or Segment Time | 区間差分、未表示なら比較区間タイム | 区間差分、欠損なら今回の区間タイム |

追加の `ComparisonTime` は比較累積タイムを固定表示、`LiveTime` は現在区間で走行中の累積時計、完了区間で確定タイムを表示します。本体の `Split Time` は走行中の時計ではないため、両者を区別しています。

`ComparisonSegmentTime`（`Comparison Segment Time`も可）は比較区間タイムを常に表示するWeb版の拡張列です。`Comparison: "Best Segments"`ならBridgeの個別Best Segment、`Personal Best`などならその比較の区間タイムを表示します。区間完了・スキップ・完走後も今回の実測値には切り替わりません。Real Time／Game Timeの指定と列幅の設定にも対応します。未設定値は「—」です。

```json
{"Name":"Best Segment","Type":"Comparison Segment Time","Comparison":"Best Segments","Width":"7ch"}
```

`total-splits` は表示行数、`upcoming-splits` は先読み行数、`always-show-last-split` は最終区間の固定表示です。現在区間に合わせて表示範囲が移動します。省略時は本体既定の8行・先読み1行・最終区間固定です。

本体の列種別・表示設定を参考にしています。Bridgeから全区間の比較値と現在Attemptを取得するため、未到達区間・途中接続時の比較値も表示します。設定は本体から自動インポートしません。アイコン・区間Custom Variable列・本体固有の装飾設定は今回の移行では追加していません。色やフォントはCSSで設定します。

### Splitsの枠・列幅・余白

全体の幅と装飾はCSS変数、各数値列の幅は`Columns`の`Width`（または`columns`の`width`）で指定できます。`Width`はこのWeb版の追加設定です。

```html
<style>
  .compact-splits {
    --ls-splits-width: 480px;
    --ls-table-layout: fixed;
    --ls-frame-width: 1px;
    --ls-frame-radius: 6px;
    --ls-border: #ffffff40;
    --ls-cell-padding-x: 10px;
    --ls-cell-padding-y: 4px;
    --ls-row-height: 32px;
  }
</style>
<livesplit-splits class="compact-splits" settings='{"Columns":[
  {"Name":"+/-","Type":"Delta","Width":"7ch"},
  {"Name":"Time","Type":"Split Time","Width":"9ch"}
]}'></livesplit-splits>
```

この例では数値列を指定幅にして区間名に残りの幅を割り当てます。`Width`は数値ならpx、文字列なら`px` / `em` / `rem` / `ch` / `%` / `auto`。列幅を削除すると自動幅に戻ります。

| CSS変数 | 用途・既定値 |
|---|---|
| `--ls-splits-width` | 枠全体の幅。100%。親の幅を上限にする |
| `--ls-table-layout` | auto（内容に応じて調整） / fixed（列幅を優先）。厳密な列割り当てはfixedを指定 |
| `--ls-name-width` | 区間名列の幅。auto |
| `--ls-column-width` | Width未指定の数値列の共通幅。auto |
| `--ls-cell-padding-x` / `--ls-cell-padding-y` | セル内の横・縦余白。各0.65em |
| `--ls-row-height` | 行の高さ。auto。長い区間名や余白で必要な場合は拡大 |
| `--ls-frame-width` / `--ls-frame-radius` | 外枠の線幅・角丸。各0px |
| `--ls-line-width` / `--ls-last-line-width` | 区間の罫線・最終区間前の線幅。1px / 2px |
| `--ls-splits-max-height` | 枠の高さ上限。none。超過時はスクロール |
| `--ls-table-min-width` | 表の最小幅。0px。枠より広い場合は横スクロール |

狭い固定幅では数値が省略されるため、必要に応じて列幅または表の最小幅を広げてください。2行表示では区間名は1行目全幅、数値列のWidthは2行目に適用します。`ShowThinSeparators: false`は罫線の幅指定より優先されます。

### Splitsの表示設定と既定値

`settings` の直下に以下を指定できます。名前は公式の設定保存名に合わせています。

| 設定 | 公式UIの項目 | 既定値 |
|---|---|---|
| `VisualSplitCount` | Total Splits | 8 |
| `SplitPreviewCount` | Upcoming Splits | 1 |
| `AlwaysShowLastSplit` | Always Show Last Split | true |
| `ShowBlankSplits` | Fill with Blank Space if Not Enough Splits | true |
| `LockLastSplit` | Lock Last Split to Bottom | true |
| `SeparatorLastSplit` | Show Separator Before Last Split | true |
| `ShowThinSeparators` | Show Thin Separators | true |
| `ShowColumnLabels` | Show Column Labels | false |
| `Display2Rows` | Display 2 Rows | false |
| `SplitTimesAccuracy` | Split Times / Accuracy | Seconds |
| `DeltasAccuracy` | Deltas / Accuracy | Tenths |
| `DropDecimals` | Drop Decimals When More Than 1 Minute | true |

Accuracyは `Seconds` / `Tenths` / `Hundredths` / `Milliseconds`。差分は本体と同様、1分未満なら `+1.2` のように表示し、ゼロにプラス記号を付けません。現在・未到達区間のDelta / Segment Deltaは表示条件が成立するまで空欄です。ライブ値の元タイマーは現在1/100秒精度のため、Milliseconds指定でもライブ差分にそれ以上の精度はありません。

Bridgeの個別Best SegmentとBest Segments比較を使ってライブ差分の開始条件を判定します。比較や必要な時間が未設定の場合は「—」です。

比較値はRunStateから全区間まとめて取得します。列の途中追加や表示開始前の区間にも利用できます。列を増やしてもRPC件数は増えません。

セルの `data-comparison` は比較名、`data-column` は `comparison-time` / `delta` / `time`、`data-column-type` は上記のtypeです。現在区間のセルには `data-live-column`、行には `data-split-index` が付きます。列を装飾する例:

```css
livesplit-splits [data-column="comparison-time"] { opacity: .65; }
```

### 区間・ペース表示パーツ

以下も独立したパーツとして配置できます。共通の `label` / `hide-label` / `server` 属性とCSSによる装飾を使用できます。

| パーツ | `livesplit-value`のfield | 表示 |
|---|---|---|
| `livesplit-segment-timer` | `segment-time` | 現在区間の経過時間。完走後は最終区間の確定時間 |
| `livesplit-previous-segment` | `previous-segment-time` | 直前に終了した区間の実測時間（累積ではない） |
| `livesplit-live-segment` | `live-segment-delta` | 選択中比較に対する現在区間の差分。Splitsと同じ表示開始条件 |
| `livesplit-current-pace` | `current-pace` | `getpredictedtime`が返す現在の比較を使った完走予測 |
| `livesplit-sum-of-best` | `sum-of-best` | Best Segments比較の最終累積タイム |
| `livesplit-real-time` | `real-time` | 選択中の計測方法にかかわらずReal Time |
| `livesplit-game-time` | `game-time` | サーバーのGame Time取得値 |

```html
<livesplit-segment-timer label="この区間"></livesplit-segment-timer>
<livesplit-previous-segment></livesplit-previous-segment>
<livesplit-live-segment></livesplit-live-segment>
<livesplit-current-pace></livesplit-current-pace>
<livesplit-sum-of-best></livesplit-sum-of-best>
<livesplit-real-time></livesplit-real-time>
<livesplit-game-time></livesplit-game-time>
```

区間タイマーはrequestAnimationFrameで更新します。Split/Skip/Undoイベントを受けると時計を即時更新し、Attempt再取得まで区間時間は「—」にします。取得後はスキップを含む直前の有効な累積タイムを基準に計算します。

Real Time・Game TimeはTimerStateを750ms周期で再同期し、Running中はperformance.now()で補間します。Game Timeが未初期化・未設定の場合は「—」、Game TimeだけPause中ならその時計は固定します。Current Paceは比較最終値と直前確定差分から計算します。

Sum of BestはRunStateのBest Segments比較の最終値を表示します。完走後の接続でも復元できます。本体の全Attempt履歴を使った走行中再計算とは異なる場合があります。Best Possible Timeは個別Best Segmentから計算し、現在区間がその値を超えた場合は現在経過時間を使います。全履歴を使う結合区間の最適化は未対応です。

## 追加の表示パーツ

### Detailed Timer・Text・Hotkey Indicator

```html
<livesplit-detailed-timer comparison1="Personal Best" comparison2="Best Segments"></livesplit-detailed-timer>
<livesplit-hotkey-indicator label="グローバルホットキー"></livesplit-hotkey-indicator>
<livesplit-text left="走行者" right="Player"></livesplit-text>
<livesplit-text left="比較対象" right-field="comparison"></livesplit-text>
<livesplit-text left="Deaths" right-variable="Deaths"></livesplit-text>
```

| パーツ | 内容・設定 |
|---|---|
| `livesplit-detailed-timer` | 全体タイマー・現在区間名・区間タイマー・2つの比較区間タイム。`comparison1` / `comparison2`で比較名を指定。既定はCurrent Comparison / Best Segments。`Current Comparison`も使用可能 |
| `livesplit-hotkey-indicator` | v3にホットキー状態がないため「取得不可」。状態線は未知色 |
| `livesplit-text` | `left` / `right`に任意のテキスト。`left-field` / `right-field`には上記field名を指定でき、固定テキストより優先 |

固定Textは通信不要で、`data-state="static"`になります。Textの内容はHTMLとして解釈しません。Hotkey Indicatorは`field="hotkey-status"`でも使用可能です。

Detailed Timerの比較欄は比較の区間所要時間です。待機中は最初の区間、走行中は現在区間、完走後は最終区間の参照値を表示します。Best SegmentsはBridgeの個別Best Segmentを直接表示し、累積比較値から推測しません。未設定の時間は「—」。現在区間名・比較累積タイムも待機中から最初の区間を表示します。時計のサイズは`--ls-timer-size` / `--ls-segment-size`、比較欄は`.ls-comparison-times`で装飾できます。

Splitsで開始前・未到達区間の個別Best Segmentを表示するには次の列を指定します。`Segment Delta`は実測との差分のため、開始前は空欄です。`Comparison Time`はBest Segmentsの累積比較値です。

```html
<livesplit-splits columns='[{"Name":"Best Segment","Type":"Segment Time","Comparison":"Best Segments"},{"Name":"PB","Type":"Split Time","Comparison":"Personal Best"}]'></livesplit-splits>
```

完了区間の`Segment Time`は今回の実測区間時間に切り替わります。比較値や個別Best Segmentの変更はRun変更イベントで再描画します。

TextのCustom Variableは `left-variable="変数名"` / `right-variable="変数名"` で指定します。変数名は大文字・小文字・空白を保持してContextStateから参照します。空の名前・改行は設定エラーです。優先順はvariable、field、固定テキスト。未設定は「—」、空文字と「-」は値のまま表示します。値はHTMLとして実行しません。

Custom VariableはContextStateに含まれ、Context変更イベントと750ms周期の再同期でまとめて更新します。本体Counterの内部カウンターとは別です。

### 公式コンポーネントとの対応範囲

公式ソースの[コンポーネント一覧](https://github.com/LiveSplit/LiveSplit/tree/master/Components)と照合しています。グラフは対象外です。追加したパーツも含め、すべての公式設定・データを再現したものではありません。

| 公式の表示 | このプロジェクトでの対応 |
|---|---|
| Timer / Splits / Detailed Timer | 同名のパーツ。データ・設定の制限は各項目参照 |
| Current Comparison / Delta / Run Prediction / Sum of Best | `comparison` / `delta` / `current-pace` / `sum-of-best`。Sum of Bestの走行中再計算には制限あり |
| Comparison Time | 現在区間は`comparison-time`、最終比較は`final-time`。後者は完走後に実測値へ変わるため公式と完全同一ではない |
| Previous Segment | `previous-segment`は実測区間時間。公式の差分やPossible Time Saveの各表示モードは未対応 |
| Text / Hotkey Indicator | 上記パーツ。TextはfieldまたはCustom Variable指定を利用 |
| Title / Blank Space / Separator | 既存のゲーム名・回数パーツ、HTML・CSSで構成できるため専用タグを追加しない |
| Possible Time Save / Total Playtime | 今回は未追加。Possible Time Save用の基礎データは取得可能。全Attempt履歴はv3では取得不可 |
| Counter | 内部カウンターはv3で公開されていないため未対応 |
| Subsplits | 今回は未追加。全区間データはBridgeで取得可能 |
| World Record / Video | 未実装。外部ランキング連携や動画の同期・再生設定は別の実装が必要 |
| Auto Splitting / Manual Game Time / Sound / Racetime / TheRun等 | 表示専用WSパーツの対象外（操作・自動計測・音声・外部サービス連携） |

## 接続先の指定

既定は `ws://127.0.0.1:54000/bridge/v3/rpc`。各パーツの `server` 属性で指定できます。属性がない場合はページURLの `?server=…`、次に既定値の順で使用します。別の接続先を指定したパーツは別の通信を使います。

```html
<livesplit-timer server="ws://127.0.0.1:54000/bridge/v3/rpc"></livesplit-timer>
```

従来の `overlay=1` の代わりに `timer.html`、またはタイマーパーツだけを配置したHTMLを使ってください。

## 同期と復元

- Eventsを先に接続し、RPCでTimer / Attempt / Run / Context / Completed Countを取得します。
- 初期取得中・RPC待ちのイベントを世代番号で検出し、古い応答を破棄して再取得します。
- Timerイベントは時計を即時反映し、Attemptと完走回数を再取得します。Runは初期接続とRun変更時に取得します。
- RPCとEventsのどちらかが切断した場合、時計の補間を止め、両接続と全状態を再構築します。session_id変更やevent_sequenceの欠落・逆順も同じです。最初のイベント番号は任意です。
- 64bit ID・sequence・ticksはProtobuf生成コードのbigintで保持します。描画時の数値変換のみ秒単位にします。
- Timer/Contextは750ms周期で再同期します。補間は最後の取得から最大2秒に制限し、RPCタイムアウトで再接続します。
- 全区間の比較・現在Attemptは復元可能です。過去すべてのAttempt履歴はv3にありません。
- 複数LiveSplitは各パーツのserver属性でポートを分けます。同じ接続先はRPC/Eventsの2接続を共有します。

## 開発・検証

```sh
npm run dev
npm run generate:protocol
npm run build
npm test
npm run test:live
```

`test:live`は起動中のBridge v3への読み取り専用検証です。接続先は環境変数 `LIVESPLIT_URL` で変更できます。Start/Split/Reset等の操作RPCは送りません。`npx tsx tests/mock-server.ts` は54001番ポートのバイナリv3フィクスチャです。

通信層は `src/bridge-client.ts`、表示モデルへの変換は `src/bridge-state.ts`、パーツは `src/components.ts`、共通CSSは `src/parts.css`。Protocolの正本は `proto/`、生成元の固定コミットは `proto/SOURCE.json`、生成コードは `src/generated/` です。生成にはbufとprotoc-gen-esを使い、配布JSにProtobufランタイムもバンドルします。

### 公式設定と表示の対応（Detailed Timer / Text / Hotkey Indicator）

公式ソースの [Detailed Timer設定](https://github.com/LiveSplit/LiveSplit.DetailedTimer/blob/master/src/LiveSplit.DetailedTimer/UI/Components/DetailedTimerSettings.cs)、[Text](https://github.com/LiveSplit/LiveSplit.Text/blob/master/src/LiveSplit.Text/UI/Components/TextComponent.cs)、[Hotkey Indicator](https://github.com/LiveSplit/LiveSplit.HotkeyIndicator/blob/master/src/LiveSplit.HotkeyIndicator/HotkeyIndicator.cs)と照合しています。`settings`はJSONで指定します。以下にない設定は無視せず設定エラーにします。本体のXMLをそのまま読み込む機能ではありません。

| パーツ | 対応する設定・表示 |
|---|---|
| Detailed Timer | `Comparison` / `Comparison2`（属性comparison1/2が優先）、`HideComparison`（比較2のみ非表示）、`ShowSplitName`（既定false） |
| Detailed Timerの時計 | `DigitsFormat` / `SegmentDigitsFormat`: `1`、`1:23`、`1:23:45`で最低表示桁数を指定。`Accuracy` / `SegmentAccuracy`: 空文字、`.2`、`.23`で秒・1/10秒・1/100秒を指定 |
| Detailed Timerの比較値 | `SegmentTimesAccuracy`: Seconds / Tenths / Hundredths |
| Detailed Timerの比率 | `SegmentTimerSizeRatio`（既定40%）、`DecimalsSize` / `SegmentTimerDecimalsSize`（既定35%）。全体・区間タイマーの小数を別々に装飾可能 |
| Text | `Text1` / `Text2`、`CustomVariable`（Text2を変数名として取得）、`Display2Rows`。属性left/right/variable指定が優先。片側だけなら中央寄せ |
| Hotkey Indicator | `IndicatorHeight` / `IndicatorWidth`（既定3px）、`HotkeysOnColor` / `HotkeysOffColor`（CSS色文字列）。通常は水平線、`orientation="vertical"`なら縦線。未知・切断中は灰色 |

```html
<livesplit-detailed-timer settings='{"ShowSplitName":true,"HideComparison":true,"SegmentAccuracy":".2","DecimalsSize":50}'></livesplit-detailed-timer>
<livesplit-text settings='{"Text1":"Deaths","Text2":"Death Count","CustomVariable":true,"Display2Rows":true}'></livesplit-text>
<livesplit-hotkey-indicator settings='{"IndicatorHeight":5,"HotkeysOnColor":"lime","HotkeysOffColor":"red"}'></livesplit-hotkey-indicator>
```

Textの左右の色とフォントは`--ls-text-left-color` / `--ls-text-right-color` / `--ls-text-left-font` / `--ls-text-right-font`で指定できます。背景・グラデーション・影・配置は通常のCSSで指定します。Detailed Timerの区間名は`.ls-segment-name`、比較名は`dt`、比較値は`dd`で独立に装飾できます。

区間アイコン・Detailed Timerで選択中と異なる計測方法を指定する機能は未対応です。Splitsの列ではReal TimeとGame Timeを個別指定できます。Bridgeの時刻は100ナノ秒単位で受信しますが、時計の表示精度は最大1/100秒です。

### PB・Best Segmentの色／レインボー

Timer、Detailed Timer、区間タイマー、直前区間タイム、Splitsの確定した数値セルに記録更新の色を適用できます。`pb-effect` / `bs-effect`をそれぞれ`color`（既定）、`rainbow`、`none`から選択します。判定値はLiveSplitから取得し、表示パーツごとに効果を指定できます。

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
| Splits | BSを達成した完了行の数値セルを強調 |

TimerのPB色は完走時の選択中比較とAttemptの最終実測値から判定します。同タイムはPB色にしません。BSは個別Best Segmentの未設定・更新、またはBest Segmentsに対する区間差分が負の場合に判定します。

PBのレインボーはこのWeb版の拡張です。以前のPersonal Best固定判定とBS直後2秒間のタイマー強調は、公式の挙動と異なるため廃止しました。リセット・切断・不整合な取得状態では効果を解除します。`data-record="pb|bs"`と`data-record-effect`で独自のCSS効果にも差し替えられます。

Timerの状態色は公式の優先順位（待機／負の時計 → ポーズ → 完走 → 走行中）に従います。走行中は現在累積差分の正負と直前差分から先行・遅延／回復・悪化を判定します。色は`--ls-not-running-color`、`--ls-paused-color`、`--ls-ahead-gaining-color`、`--ls-ahead-losing-color`、`--ls-behind-gaining-color`、`--ls-behind-losing-color`で変更できます。イベント直後はAttempt取得が完了するまで記録色の反映を保留します。
