# 接続設定

既定の接続先は `ws://127.0.0.1:54000/bridge/v4/rpc` です。LiveSplit.BridgeのJSON Protocol v4を使用します。導入手順は[導入ガイド](getting-started.md)を参照してください。

[LiveSplit.Bridge](https://github.com/Nanahuse/LiveSplit.Bridge#設定)は同じPCからの接続専用です。ブラウザー・OBSもLiveSplitと同じPCで起動します。

## 部品ごとに接続先を指定する

`server` 属性にBridgeのRPC URLを指定します。

```html
<livesplit-timer server="ws://127.0.0.1:54001/bridge/v4/rpc"></livesplit-timer>
<livesplit-status server="ws://127.0.0.1:54001/bridge/v4/rpc"></livesplit-status>
```

Statusにも同じ接続先を指定すると、その接続状態を確認できます。RPCに加え、同じホスト・ポートの `/bridge/v4/events` に自動で接続します。両方に接続できる必要があります。

URLは `ws://` または `wss://` で、パスの末尾は `/bridge/v4/rpc` にします。ユーザー名・パスワード、クエリ、フラグメントを含む接続先は指定できません。

## ページ全体の接続先と優先順位

接続先は次の順に選ばれます。`server` は親要素から継承しないため、部品ごとに指定します。

1. その部品の `server` 属性。
2. ページURLの `?server=…`。
3. 既定値 `ws://127.0.0.1:54000/bridge/v4/rpc`。

ページURLで指定する例です。`layout.html` のパスは自分の環境に置き換えてください。

```text
file:///C:/layouts/layout.html?server=ws%3A%2F%2F127.0.0.1%3A54001%2Fbridge%2Fv4%2Frpc
```

`server` 属性のある部品はページURLの指定より優先されます。OBSのローカルファイル表示ではHTML内の各部品に `server` を指定すると接続先を明示できます。

## 複数のLiveSplitを表示する

それぞれのBridgeを異なるポートで起動し、部品ごとに接続先を分けます。

```html
<section>
  <livesplit-timer server="ws://127.0.0.1:54000/bridge/v4/rpc"></livesplit-timer>
  <livesplit-splits server="ws://127.0.0.1:54000/bridge/v4/rpc"></livesplit-splits>
</section>
<section>
  <livesplit-timer server="ws://127.0.0.1:54001/bridge/v4/rpc"></livesplit-timer>
  <livesplit-splits server="ws://127.0.0.1:54001/bridge/v4/rpc"></livesplit-splits>
</section>
```

同じページで同じ接続先を使う部品はRPC・Eventsの2接続を共有します。部品を増やしても接続数は増えません。最後の部品を取り除くと、その接続を閉じます。

## 接続状態と切断時の表示

`<livesplit-status></livesplit-status>` で接続状態を表示できます。各部品の出力属性 `data-state` でも状態を確認でき、CSSの選択条件に使えます。

| data-state | 意味・表示 |
| --- | --- |
| `connecting` | 接続中 |
| `connected` | 接続済み |
| `disconnected` | 再接続待ち。Statusに理由を表示する場合あり |
| `error` | 接続先URL・JSON・設定値などの設定エラー |
| `static` | 固定Text。通信不要 |

通信が切れると時計の補間を止め、表示データをクリアして自動で再接続します。接続後は全区間の比較と現在のAttemptを取り直すため、計測途中から表示できます。過去すべてのAttempt履歴は取得できません。

時計とContext（Custom Variableなど）は750ms周期で再同期します。イベントでも更新し、時計の補間は最後の取得から最大2秒に制限します。

接続できない場合は[トラブルシューティング](troubleshooting.md)、旧URLからの移行は[対応範囲と移行](compatibility.md)、同期アルゴリズムは[開発・検証](development.md)を参照してください。

[目次](README.md)
