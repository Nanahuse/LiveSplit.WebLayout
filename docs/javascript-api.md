# JavaScript API

`livesplit.js`を読み込むと、通常のJavaScriptから`window.LiveSplit`を使えます。標準パーツとJavaScriptは同じ接続先のSessionを共有します。

```html
<script defer src="./livesplit.js"></script>
<p id="game"></p>
<output id="clock"></output>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const { getSession, formatTime } = window.LiveSplit;
    const session = getSession();
    const game = document.getElementById('game');
    const timer = document.getElementById('clock');

    const stopState = session.subscribeState(state => {
      game.textContent = state.run?.gameName ?? '接続待ち';
    });
    const stopClock = session.subscribeClock(clock => {
      timer.textContent = formatTime(clock[clock.timingMethod]);
    });
    const stopSplit = session.on('split', ({ result }) => {
      if (result) console.log(result.name, result.splitTime.realTime);
    });

    // この表示をレイアウトから取り外すときに呼び出します。
    function dispose() {
      stopState();
      stopClock();
      stopSplit();
    }
  });
</script>
```

## Sessionと購読

| API | 内容 |
| --- | --- |
| `LiveSplit.getSession(server?)` | Bridge v4 RPCのURLから共有Sessionを取得。省略時は[既定の接続先](connection.md) |
| `session.getState()` | 最新の同期済み状態を取得 |
| `session.getClock()` | 呼び出し時点の補間済み時計を取得 |
| `session.subscribeState(callback)` | 現在の状態を即時通知し、その後は同期済み状態の変更時に通知 |
| `session.subscribeClock(callback)` | 現在の時計を即時通知し、その後は時計の変更時に通知 |
| `session.on(type, callback)` | 指定した操作・記録イベントを今後受信したときに通知 |
| `LiveSplit.formatTime(seconds, showSign = false)` | 数値の秒を `1:23.45` の形式に整形。`null`は「—」 |

購読を登録すると接続されます。購読が返す関数を呼ぶと解除できます。時計購読がない間、フレーム更新は停止します。全購読がなくなると接続を閉じます。

## データ

時刻・差分・オフセットはすべて**秒単位の数値**です。未取得・未設定の時間は`null`、差分が負なら比較より速いことを表します。状態・時計・イベントは読み取り専用です。

| `SessionState`の項目 | 内容 |
| --- | --- |
| `status`、`endpoint`、`message` | 接続状態（`connecting` / `connected` / `disconnected`）、RPC URL、接続エラー |
| `phase`、`splitIndex` | `not_running` / `running` / `paused` / `ended`。区間番号は0始まりで、待機中は -1、完走時は最終区間の次 |
| `run` | `gameName`、`categoryName`、`offset`、比較名の配列 `comparisons`、`segments` |
| `run.segments[]` | `index`、`name`、`bestSegment`、比較名で引ける `comparisons`。時間は `{ realTime, gameTime }` |
| `context` | 選択中の `timingMethod`（`realTime` / `gameTime`）、`comparison`、`variables` |
| `attempt` | 現在Attemptの `count` と、`{ index, splitTime, variables }` の `segments` |
| `delta` | 計測方法ごとに、最後に確定した実測タイムから選択中の比較タイムを引いた値 |
| `completedCount`、`attemptFresh` | Bridgeが報告した完走数、Attemptが同期済みかどうか |

未接続時は `phase`、`run`、`context`、`attempt`、`completedCount` が `null` です。区間が完了していない場合やスキップした場合は実測タイムがありません。Bridgeは未完了区間を時間が空の項目として返すことがあります。

`ClockState`は`realTime`、`gameTime`、`gameTimePaused`、`timingMethod`、`phase`、`splitIndex`を持ちます。操作直後は時計の`phase`や`splitIndex`が先に進むことがあります。確定タイムと照合するときは、同期済み状態または操作イベントを使ってください。

## 操作イベント

- `start`、`split`、`skip`、`undo`、`reset`、`pause`、`resume`
- `finish` はBridgeが完走状態を通知した `split` の直後
- `personal-best` と `best-segment` は、比較に必要な値を確認できた場合に通知。対象の計測方法は `timingMethods` で取得

各イベントは`type`、Bridgeの`sequence`、操作直後の`phase`と`splitIndex`、`result`を持ちます。Splitの`result`には区間の`index`、`name`、`splitTime`、`variables`、比較名をキーにした`deltas`が含まれます。Attemptの同期前にResetやUndoで区間の実測タイムが消えた場合、その`split`の`result`は`null`です。最終Splitでは続けて`finish`も`result: null`で通知し、その後で`reset`または`undo`を通知します。

同期済み状態を公開してから、受信した操作を受信順に通知します。初期接続・再接続時は現在の状態を復元します。過去の操作は発火しません。

## Split結果の表示例

配布用の `dist/split-result.html` に実装例があります。`split` の `result` から選択中の計測方法の確定タイムと比較差分を表示します。`result` が `null` の場合は通常表示に戻ります。比較タイムがない場合は区間名と確定タイムを表示します。

`personal-best` と `best-segment` は、表示中のSplitと `sequence` が一致し、`timingMethods` に結果の計測方法が含まれるときに表示します。結果の表示中も `subscribeClock` でタイマーを更新します。2.5秒後にタイマーへ戻り、Undo・Reset・切断時は演出を中断します。

[ソースを読む](https://github.com/Nanahuse/LiveSplit.WebLayout/blob/main/split-result.html)

## 横型スプリットリボンの表示例

`dist/split-ribbon.html` は `subscribeState` で全体の進捗と、現在区間およびその前後2件ずつのカードを更新します。スキップした区間も進捗に含めます。完了区間の差分は選択中の計測方法に従い、`attempt.segments` の累積タイムから `run.segments` の比較タイムを引いて求めます。実測タイムや比較タイムがない区間はグレーで表示します。ヘッダーには `state.delta` の値を使い、`subscribeClock` では時計の文字だけを更新します。

同期済み状態と直後の操作イベントをまとめて反映します。`split` と `skip` ではカードを左へ動かし、`undo` では右へ戻します。`reset` では最初の区間に戻り、再接続時は復元された位置を即時に表示します。`best-segment` を受け取ると、選択中の計測方法に該当する区間のカードを短く強調します。

[ソースを読む](https://github.com/Nanahuse/LiveSplit.WebLayout/blob/main/split-ribbon.html)

## ルートマップの表示例

`dist/route-map.html` は `state.splitIndex` から現在地を決め、`state.attempt.segments` の確定タイムがある地点を結んで通過経路を復元します。`split` と `skip` でマーカーが移動し、`undo` で前の地点へ戻ります。Resetでは開始地点、再接続時は復元した位置を即時に表示します。比較差分を取得できたSplitでは、完了地点に差分を短時間表示します。

初期配置では12区間ごとにエリアが切り替わります。独自の地図を作るには `route.nodes` に `{ split: 0, name: '入口', area: 0, x: 70, y: 246 }` のように地点を指定します。`split` と `area` は0始まりで、`x` と `y` はそのエリアの左上を原点にした座標です。`route.areaNames` でエリア名を指定できます。

隣り合う区間の既定の経路は直線です。分岐や曲線を追加するには `route.paths` に `{ from, to, d }` を指定します。`from` と `to` は区間番号で、完走地点は `"finish"` です。`d` を指定する場合は、全体マップの座標でSVGパスを書き、始点と終点を各地点の座標に合わせます。スキップを挟んだ地点間に経路が定義されていれば、通過経路として着色します。

[ソースを読む](https://github.com/Nanahuse/LiveSplit.WebLayout/blob/main/route-map.html) / [目次](README.md)
