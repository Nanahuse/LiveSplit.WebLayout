# LiveSplit.WebLayout

LiveSplit.Bridge JSON Protocol v4を使う表示専用HTMLパーツ集です。TypeScript + Viteで開発し、利用時のNode.js・pnpm・HTTPサーバーは不要です。配布物のHTMLをローカルファイルとして直接開けます。LiveSplit内蔵WebSocketへの接続・フォールバック・操作RPCはありません。旧Protobuf v3には対応していないため、BridgeもJSON v4対応版に更新してください。独自HTMLの接続先に `/bridge/v3/rpc` を指定している場合は `/bridge/v4/rpc` に変更します。

## ビルド・起動

開発にはNode.js 22.12以降とpnpm 12.9.1を使用します。

```sh
pnpm install --frozen-lockfile
pnpm build
```

ローカルファイル接続対応のLiveSplit.Bridge Protocol v4を起動して、`dist/index.html`を直接開いてください。既定のRPC接続先は`ws://127.0.0.1:54000/bridge/v4/rpc`です。OBSでは「ローカルファイル」に`dist/index.html`または透過タイマーの`dist/timer.html`を指定します。

HTMLと同じフォルダーに`livesplit.js`・`livesplit.css`を配置します。利用時のNode.js・HTTPサーバーは不要です。独自のレイアウトは次回ビルドで上書きされない別フォルダーに保存してください。

## ドキュメント

CSS設定と部品ごとのカスタマイズは[docsの目次](docs/README.md)にまとめています。

| 内容 | ガイド |
|---|---|
| 導入・HTMLへの配置 | [はじめに](docs/getting-started.md) |
| 共通の枠・文字・配置 | [CSS設定](docs/css/README.md) |
| PB・BS・状態色 | [記録色](docs/css/record-colors.md) |
| 部品別の属性・CSS・テンプレート | [UIコンポーネント一覧](docs/components/README.md) |
| 時計 | [Timerなど](docs/components/timers/README.md) |
| 区間表 | [Splits](docs/components/splits/README.md)・[Subsplits](docs/components/splits/subsplits.md) |
| 差分・短縮可能時間・予測 | [時間表示パーツ](docs/components/metrics/README.md) |
| 名前・状態・回数・Custom Variable | [情報表示パーツ](docs/components/info/README.md) |
| 接続先・更新周期・再接続 | [接続と同期](docs/connection.md) |
| 公式との差分・未対応機能 | [対応範囲](docs/compatibility.md) |
| 開発コマンド・構成 | [開発・検証](docs/development.md) |
