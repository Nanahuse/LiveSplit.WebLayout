# 接続と同期

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

[目次](README.md)
