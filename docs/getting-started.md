# 導入ガイド

配布ZIPを展開し、LiveSplit.Bridgeを起動すると、ブラウザーやOBSで表示できます。利用時のNode.js・pnpm・HTTPサーバーは不要です。

## 1. 配布ZIPを取得する

[GitHub Releases](https://github.com/Nanahuse/LiveSplit.WebLayout/releases)のAssetsから `LiveSplit.WebLayout-vX.Y.Z.zip` をダウンロードし、任意のフォルダーに展開します。ソースコードのZIPではなく、ビルド済みの配布ZIPを選んでください。

表示に使うファイルは展開先の `dist/` にあります。

| ファイル | 用途 |
| --- | --- |
| `index.html` | 全パーツの配置例。最初の表示確認に使用 |
| `timer.html` | OBS向けの透過タイマーだけの配置例 |
| `livesplit.js` | 表示パーツを登録するJavaScript。HTMLと一緒に配置 |
| `livesplit.css` | 初期スタイル。HTMLと一緒に配置。編集・差し替え・省略も可能 |

ZIPにはREADME、ドキュメント、ライセンス、`VERSION.txt`も含まれます。ソースからビルドする場合は[開発・検証](development.md)を参照してください。

## 2. LiveSplit.Bridgeを準備する

ローカルファイルからの接続に対応した **JSON Protocol v4のLiveSplit.Bridge** を使います。LiveSplitと表示に使うブラウザー・OBSは同じPCで起動してください。

1. [BridgeのReleases](https://github.com/Nanahuse/LiveSplit.Bridge/releases)から対応版の `LiveSplit.Bridge-v*.zip` を取得します。
2. LiveSplitを終了し、ZIP内の `LiveSplit.Bridge.dll` をLiveSplitの `Components` フォルダーに置きます。
3. LiveSplitを起動し、右クリックの `Edit Layout...` を開きます。
4. `+` → `Control` → `LiveSplit Bridge` を選んで追加し、レイアウトを保存します。
5. Bridgeの設定で `Status: Running` を確認し、表示したいゲーム・区間をLiveSplitで読み込みます。

Bridge自体はレイアウトに表示されません。対応環境や更新方法は[Bridgeの導入説明](https://github.com/Nanahuse/LiveSplit.Bridge#インストール)を参照してください。

既定のRPC接続先は `ws://127.0.0.1:54000/bridge/v4/rpc` です。同じポートの `/bridge/v4/events` にも自動で接続します。Bridge側で接続先やポートを変更している場合は[接続設定](connection.md)に従って指定します。

必要なのはLiveSplit.Bridgeです。LiveSplit内蔵WebSocketや旧Protobuf v3には対応していません。旧版からの変更点は[対応範囲と移行](compatibility.md)を参照してください。

## 3. ブラウザーで表示を確認する

展開先の `dist/index.html` を直接開きます。接続状態が「接続済み」になり、LiveSplitで計測を始めるとタイマーが進むことを確認してください。HTTP経由での表示も利用できます。

表示・接続に問題がある場合は[トラブルシューティング](troubleshooting.md)を参照してください。

## 4. OBSに表示する

1. OBSでブラウザソースを追加します。
2. 「ローカルファイル」を有効にし、展開先の `dist/index.html` を指定します。
3. ソースの幅・高さをレイアウトに合わせます。

タイマーだけを透過背景で表示する場合は `dist/timer.html` を選びます。

## 5. 自分のレイアウトを作る

`index.html` または `timer.html` を選び、`livesplit.js`・`livesplit.css` と一緒に別フォルダーへコピーします。HTMLを編集して保存し、ブラウザーやOBSでそのHTMLを読み込み直します。編集後の再ビルドは不要です。

開発時の `dist/` は次のビルドで置き換わるため、自分のレイアウトは別フォルダーに保存してください。基本のHTML、部品の追加、属性・CSSの変更は[カスタマイズ](customization.md)で説明します。

[カスタマイズへ](customization.md) / [目次](README.md)
