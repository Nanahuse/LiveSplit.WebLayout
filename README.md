# LiveSplit.WebLayout

LiveSplit 内蔵の WebSocket サーバーに接続する、表示専用の Web UI です。現在のタイムを 1/100 秒まで表示します。開始・停止・リセットなどの操作は LiveSplit 側で行います。

## 起動

1. WebSocket サーバーを内蔵した LiveSplit を起動します。
2. LiveSplit を右クリックし、**Control → Start WS Server** を選びます（TCP サーバーではありません）。既定のポートは **16834** です。
3. Node.js 22.12 以降で、このリポジトリから次を実行します。

   ```sh
   npm ci
   npm start
   ```

4. <http://localhost:5173> をブラウザーで開きます。自動で `ws://localhost:16834/livesplit` に接続します。

タイマーは LiveSplit の現在の計測方法（Real Time / Game Time）に従います。Game Time が未初期化の場合、LiveSplit 側の仕様により Real Time が返ります。一時停止・リセット・終了・負の開始オフセットも受信した値をそのまま反映します。

## 接続先と OBS

接続先を変更する場合は `server` クエリに URL エンコードした WebSocket URL を指定します。

```text
http://localhost:5173/?server=ws%3A%2F%2F127.0.0.1%3A16834%2Flivesplit
```

OBS のブラウザソースには次の URL を設定すると、背景・説明・接続表示を省いたタイマーだけを表示します。サイズは幅 800、高さ 180 が目安です。HTTP サーバーは起動したままにしてください。

```text
http://localhost:5173/?overlay=1
```

`server` と `overlay=1` は `&` で組み合わせられます。ローカルの `ws://` 接続にはこの HTTP URL を使ってください。HTTPS 配信ページからの `ws://` 接続はブラウザーで拒否される場合があります。ブラウザーにローカルネットワーク接続の許可を求められた場合は許可してください。

未接続・無効な応答・応答の途絶時は `—:—.—` を表示し、2 秒後に再接続します。最後の値を現在時刻として残しません。通常表示には接続状況と案内が出ます。接続できない場合は WS サーバーの起動状態、LiveSplit 側のポート設定を確認してください。

## 実装

- HTML / CSS / TypeScript。Vite で開発・ビルドします。フレームワーク・外部フォント・実行時依存はありません。
- 送信するコマンドは読み取り用の `getcurrenttime` のみ。WebSocket メッセージに改行や JSON 包装は付けません。
- 応答を受け取ってから約 33ms 後に次の取得を行います。リクエストは常に最大 1 件。接続・応答タイムアウトは 3 秒です。
- ローカルで時間を進める補間は行いません。Game Time のロード待ちや一時停止を正しく反映するためです。
- `src/style.css` で見た目、`src/timer.ts` で通信と時刻整形を変更できます。
- 開発用 HTTP サーバーは `127.0.0.1` のみに公開します。ポートは `npm start -- --port 5174` で変更できます。

```sh
npm test
npm run typecheck
npm run build
```

時刻形式と通信のテストは tsx と Node.js 標準のテストランナーを使用します。ビルド結果は `dist/` に出力され、`npm run preview` で確認できます。OBS で使用する場合も `npm start` またはプレビューサーバーを起動したままにしてください。

実際の LiveSplit で WS サーバーを起動した状態で `npm run test:live` を実行すると、60 件の時刻応答とクライアントの切断後の自動再接続を確認できます。開始・停止・リセットは行いません。接続先は環境変数 `LIVESPLIT_URL` で変更できます。

仕様の参照先: [LiveSplit 公式 README / The LiveSplit Server](https://github.com/LiveSplit/LiveSplit#the-livesplit-server)、[CommandServer.cs](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Server/CommandServer.cs)。サードパーティーの WebSocket プラグイン用の JSON プロトコルには対応していません。
