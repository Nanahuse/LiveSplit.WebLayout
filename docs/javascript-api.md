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
- `finish` は最終区間の `split` の直後
- `personal-best` と `best-segment` は、比較に必要な値を確認できた場合に通知。対象の計測方法は `timingMethods` で取得

各イベントは`type`、Bridgeの`sequence`、操作直後の`phase`と`splitIndex`、`result`を持ちます。Splitの`result`には区間の`index`、`name`、`splitTime`、`variables`、比較名をキーにした`deltas`が含まれます。ResetやUndoが同期前に続いて区間実測が上書きされた場合、当該Splitの`result`は`null`です。

同期済み状態を公開してから、受信した操作を受信順に通知します。初期接続・再接続時は現在の状態を復元します。過去の操作は発火しません。

配布用`index.html`には、Splitの確定結果に切り替わり、2.5秒後に通常のタイマーに戻る例があります。Undo・Reset・切断時はすぐに通常表示へ戻ります。

[目次](README.md)
