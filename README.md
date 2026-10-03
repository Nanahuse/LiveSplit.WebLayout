# LiveSplit.WebLayout

LiveSplit内蔵WebSocketサーバーの情報を表示するHTMLパーツ集です。TypeScript + Viteで開発し、配布後はNode.js・npm・HTTPサーバーなしで利用できます。操作コマンドは送信しません。

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

利用者には必要なHTMLとJS・CSSを同じフォルダーで渡します。LiveSplitで **Control → Start WS Server** を有効にし、HTMLをブラウザーで直接開いてください。OBSではブラウザソースの「ローカルファイル」でHTMLを選択します。`file://`での実動作は自動ブラウザーツールの制限により未検証です。通常のHTTP静的配信にも対応します。

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

`TimingMethod` は `Current Timing Method` / `Real Time` / `Game Time`。固定指定が本体の選択中方式と異なる場合、標準WSではその方式の区間比較値を取得できないため表示できません。セルに `data-unavailable="timing-method"` と説明を付け、別方式の数値を表示しません。

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

`total-splits` は表示行数、`upcoming-splits` は先読み行数、`always-show-last-split` は最終区間の固定表示です。現在区間に合わせて表示範囲が移動します。省略時は本体既定の8行・先読み1行・最終区間固定です。

本体UIのSplits設定と [列の実装](https://github.com/LiveSplit/LiveSplit.Splits/blob/master/src/LiveSplit.Splits/UI/Components/SplitComponent.cs) を確認して上記の計算・切り替えを合わせています。ただし標準WSだけでは完全な機能等価にはなりません。未到達・接続前の全比較値、各列独立のReal Time / Game Time、個別Best Segment、アイコン、区間カスタム変数は未対応です。スキップした区間は直前の有効な基準を取得できた場合だけ計算し、欠損した履歴は推測しません。設定は本体から自動インポートしません。Custom Variable列・アイコン・本体固有の色設定は未対応です。色やフォントはCSSで設定してください。

### 表示設定と既定値

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

標準WebSocketは各区間の `BestSegmentTime` を直接公開していないため、Best Segmentsの現在比較タイムと直近の確定差分から到達ペースを判定します。本体の [CheckLiveDelta](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Model/LiveSplitStateHelper.cs) にある個別Best Segmentの追加条件までは再現できません。特に区間スキップ・欠損値がある場合、本体と表示開始のタイミングが異なることがあります。比較値がない場合は推測せず「—」です。

比較値は現在区間にいる間に取得・保存します。標準WSには任意の区間の比較タイムを読むコマンドがないため、未到達区間や接続前に通過した区間の比較タイムは「—」になります。列を途中追加した場合も取得以降の区間が対象です。比較を増やすほど初回取得・区間切り替え後の更新に時間がかかります。

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

区間タイマーは約33msのタイマー応答で更新します。区間開始点が不明な途中接続・取り逃した区間では「—」となります。記録したスキップ区間は直前の有効な区間までさかのぼって計算します。待機中は区間タイマー・区間差分とも「—」です。直前の**累積**タイムが必要なら従来の `livesplit-previous-split` を使用してください。

Current Pace・Real Time・Game Timeは補助情報の高速周期（目標100ms）で更新します。Game Timeが初期化されていない場合、標準サーバーはReal Timeを返すため、その値を表示します。

Sum of Bestは本体が生成したBest Segments比較を取得します。本体のSum of Bestコンポーネントが走行中の新記録を含めて再計算した値とは異なる場合があります。完走後の `getfinaltime` は実測値になるため、完走前の最後の比較値を保持します。完走後に初めて接続した場合や完走後に計測方法を切り替えた場合は「—」となります。

## 接続先

既定は `ws://localhost:16834/livesplit`。各パーツの `server` 属性で指定できます。属性がない場合はページURLの `?server=…`、次に既定値の順で使用します。別の接続先を指定したパーツは別の通信を使います。

```html
<livesplit-timer server="ws://127.0.0.1:16834/livesplit"></livesplit-timer>
```

従来の `overlay=1` の代わりに `timer.html`、またはタイマーパーツだけを配置したHTMLを使ってください。

## データと互換性

- master対応版ではゲーム名・カテゴリ・全区間名を開始前から取得します。1.8.37など未対応のサーバーでは未取得項目は「—」、区間は取得できた範囲を表示します。
- Splits表は接続中に取得した区間結果を記録します。比較差は比較累積タイムを事前取得できた区間のみ表示します。取り逃した区間は推測しません。
- リセット・切断・再読み込み・最後のパーツ削除で履歴は消えます。区間巻き戻しでは該当区間以降の結果を消去します。
- 計測方法や比較を走行中に切り替えた場合はページを再読み込みしてください。
- タイマーはLiveSplitの計測方法に従い、取得間隔は応答後約33ms。ローカルで時刻を進める補間は行いません。
- 区間状態・結果・比較タイム・差分・Best Possible Time・最終タイム・計測方法は100msを目標に一巡します。一巡内は応答後に待機時間を挟まず次を要求し、取得中の区間変更を検出する前後確認も維持します。
- 試行回数・完走回数は1秒、ゲーム名・カテゴリ・区間数・各区間名は5秒を更新間隔の目安とします。接続直後は順次取得し、低頻度項目は高速更新の一巡につき最大1件に制限します。区間数が多い場合、区間名全体の取得・更新には5秒以上かかります。
- 上記はスケジュール上の目標です。通信時間・ブラウザのタイマー制限・未応答時のタイムアウトにより遅れる場合があります。100ms以内に一巡できなかった場合は、完了後すぐ次の一巡を開始します。
- 同じ接続先ごとにタイマーと補助情報の2接続を使用し、それぞれ同時リクエストは1件です。
- ゲーム名など外部の文字列はHTMLとして解釈せずテキストとして表示します。

## 開発・検証

```sh
npm run dev
npm run build
npm test
npm run test:live
```

`test:live`は起動中のLiveSplitに対する読み取り専用テストです。接続先は環境変数 `LIVESPLIT_URL` で変更できます。`npx tsx tests/mock-server.ts` では固定データのテストサーバーを起動します。

実装は `src/components.ts`（パーツ）、`src/session.ts`（共有接続）、`src/parts.css`（既定CSS）、`src/readout.ts` / `src/splits.ts`（表示・履歴）、`src/timer.ts`（通信）です。配置例はルートの `index.html` から出力されます。

仕様: [LiveSplit公式README](https://github.com/LiveSplit/LiveSplit#the-livesplit-server)。サードパーティーのJSON形式WebSocketプラグインは対象外です。

