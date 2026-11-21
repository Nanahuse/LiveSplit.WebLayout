# カスタマイズ

一つのHTMLを編集し、部品の配置、ラベル、文字・色を順に変更します。[導入ガイド](getting-started.md)で表示を確認し、配布物のHTML・JS・CSSを作業用フォルダーへコピーしてから始めてください。

## 1. 基本のHTMLを用意する

作業用フォルダーに `layout.html` を作り、次の内容を保存します。同じフォルダーに配布物の `livesplit.js` と `livesplit.css` を置いてください。

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>配信用レイアウト</title>
  <link rel="stylesheet" href="./livesplit.css">
  <script defer src="./livesplit.js"></script>
  <style>
    body {
      margin: 0;
      background: #101318;
      color: white;
      font-family: sans-serif;
    }
    main { width: 480px; display: grid; gap: 12px; }
  </style>
</head>
<body>
  <main>
    <livesplit-game></livesplit-game>
    <livesplit-timer></livesplit-timer>
    <livesplit-splits></livesplit-splits>
  </main>
</body>
</html>
```

`layout.html` をブラウザーで開きます。JavaScriptは通常のスクリプトとして読み込むため `type="module"` は不要です。付属CSSはbodyの背景・余白・配置を指定しないので、この例ではHTML側に記述しています。

## 2. 部品を追加・並べ替える

`main` の中でタグを移動すると表示順が変わります。不要なタグは削除し、複数表示したい部品は複製できます。例えば区間表の後ろに次を追加します。

```html
<livesplit-delta></livesplit-delta>
<livesplit-previous-segment></livesplit-previous-segment>
<livesplit-text left="走行者" right="Player"></livesplit-text>
<livesplit-status></livesplit-status>
```

Deltaは累積差分、Previous Segmentは直前区間の差分、Textは任意の文字、Statusは接続状態を表示します。同じ接続先の部品は通信を共有します。部品同士は入れ子にせず、`main` や `div` の中に並べてください。

ほかの表示は[コンポーネント一覧](components/README.md)から探せます。

## 3. ラベルと配置を変える

追加したDeltaのタグを次に置き換えます。

```html
<livesplit-delta label="比較との差" layout="row"></livesplit-delta>
```

ラベル付き部品は `label` でラベルを変更でき、`hide-label` を付けるとラベルを隠せます。`layout="row"` はラベルと値を左右に並べます。通常は上下配置ですが、Previous SegmentとPossible Time Saveは左右配置が既定です。この2つを上下配置にする方法は「settingsで表示内容を変える」の例を参照してください。

TimerやGameなどにはこのラベル配置設定はありません。共通属性の対象は[部品の共通設定](components/common.md)で確認できます。

## 4. CSSで文字・色・枠を変える

最初のHTMLの `style` 内に次を追記します。

```css
livesplit-timer { --ls-timer-size: 80px; --ls-decimal-size: .45em; }
livesplit-delta {
  --ls-label-size: 14px;
  --ls-value-size: 28px;
  --ls-ahead: #4ade80;
  --ls-behind: #fb7185;
  --ls-padding: 8px 12px;
  --ls-background: #15202b;
  --ls-frame-width: 1px;
  --ls-border: #ffffff40;
  --ls-frame-radius: 6px;
}
```

同じ種類の部品を別々に装飾する場合は `class` を付け、そのクラスをCSSで指定します。CSSを別ファイルにする場合は、`livesplit.css` の後で読み込みます。

変数の一覧は[共通CSS](css/common.md)、PB・Best Segmentやタイマーの状態による色は[記録色と状態色](css/record-colors.md)を参照してください。状態色や差分色が通常の文字色に優先する場合があります。

## 5. settingsで表示内容を変える

`settings` は対応する部品にJSONオブジェクトを渡す属性です。Previous SegmentとSplitsを次のように置き換えると、短縮可能時間の併記と区間表の行数を設定できます。

```html
<livesplit-previous-segment label="直前の差分"
  settings='{"ShowPossibleTimeSave":true,"Display2Rows":true}'></livesplit-previous-segment>
<livesplit-splits settings='{"VisualSplitCount":6,"ShowColumnLabels":true}'></livesplit-splits>
```

属性値はシングルクォートで囲み、JSONのキー・文字列はダブルクォートで囲みます。真偽値の `true`・`false` と数値は引用符で囲みません。設定名は大文字・小文字を区別し、使える項目は部品ごとに異なります。LiveSplit本体のレイアウト設定は自動で読み込みません。

区間表の列を変更する場合は[Splitsの列設定](components/splits/columns.md)へ進んでください。

## 6. Splitに合わせて表示を変える

JavaScriptからSessionを購読すると、確定した区間名、タイム、比較との差分を使って独自のHTMLを更新できます。配布用の `split-result.html` はSplitの結果を2.5秒表示した後にタイマーへ戻ります。購読や表示の更新方法は[JavaScript API](javascript-api.md#split結果の表示例)を参照してください。

## 7. 保存して使う

HTMLと追加したCSSを保存し、ブラウザーを再読み込みします。OBSでは作業用の `layout.html` をブラウザソースのローカルファイルに指定し、ソースを再読み込みしてください。幅はこの例の480pxを目安にし、高さは内容が収まるよう調整します。

この例はブラウザーでも文字を確認しやすい暗い背景です。OBSで背景を透過する場合は、bodyの指定を `background: transparent;` に変更します。

再ビルドは不要です。レイアウトを移動・バックアップするときは、HTML、`livesplit.js`、使用するCSSをまとめて保存し、相対パスを維持してください。反映されない場合は[トラブルシューティング](troubleshooting.md)を参照してください。

[コンポーネント一覧](components/README.md) / [CSS設定](css/README.md) / [目次](README.md)
