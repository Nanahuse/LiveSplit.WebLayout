# 開発・検証

開発にはNode.js 22.12以降とpnpm 12.9.1を使用します。利用だけなら[導入ガイド](getting-started.md)の配布ZIPを使えます。

## 環境を準備してビルドする

コマンドはリポジトリのルートで実行します。

```sh
pnpm install --frozen-lockfile
pnpm build
```

`dist/` に `index.html`（全パーツの例）、`timer.html`（透過タイマー）、`livesplit.js`（通常のスクリプト）、`livesplit.css` を出力します。HTMLとJS・CSSを一緒に配置すればローカルファイルで表示できます。ビルドで `dist/` は置き換わるため、利用者のレイアウトは別フォルダーに保存します。

## 開発・検証コマンド

```sh
pnpm run dev
pnpm run generate:protocol
pnpm run build
pnpm test
pnpm run test:live
```

`test:live`は起動中のBridge v4への読み取り専用検証です。接続先は環境変数 `LIVESPLIT_URL` で変更できます。Start/Split/Reset等の操作RPCは送りません。`pnpm exec tsx tests/mock-server.ts` は54001番ポートのJSON v4フィクスチャです。

## ソース構成とプロトコル生成

通信層は `src/bridge-client.ts`、JSONの検証・変換は `src/bridge-protocol.ts`、表示モデルへの変換は `src/bridge-state.ts`、パーツは `src/components.ts`、共通CSSは `src/parts.css`。公式JSON Schemaはリポジトリに保存せず、`schemas/SOURCE.json` に取得元・固定コミット・参照パスを記録します。`generate:protocol` はGitHub上の固定コミットからSchemaをメモリ上に取得し、内部のcamelCase型と検証用定義を `src/generated/protocol.ts` に生成します。SchemaのJSONファイルは書き出しません。生成時にはNode.jsとインターネット接続が必要です。

生成済みのコードを保存しているため、通常のビルド・テストや配布HTMLの表示時にはSchemaを取得しません。表示にNode.js・HTTPサーバー・インターネット接続は不要です。wireのnullable値は内部ではundefined、ticksはbigintとして扱います。Protobufランタイムは不要です。

## 内部設計：同期と復元

接続先の設定方法と切断時の見え方は[接続設定](connection.md)を参照してください。ここでは通信実装の仕組みを説明します。

### 初期取得とイベントの整合性

- Eventsを先に接続し、RPCでTimer / Attempt / Run / Context / Completed Countを取得します。
- 初期取得中・RPC待ちのイベントを世代番号で検出し、古い応答を破棄して再取得します。
- Timerイベントは時計を即時反映し、Attemptと完走回数を再取得します。Runは初期接続・Run変更・Reset時に取得します。Resetのtimer_stateがnullでも全状態を取り直します。
- RPCとEventsのどちらかが切断した場合、時計の補間を止め、両接続と全状態を再構築します。session_id変更やevent_sequenceの欠落・逆順も同じです。最初のイベント番号は任意です。

### メッセージ・時刻・再同期

- JSON v4のText Messageを使います。IDはuint32、event_sequenceは最大値4294967295の次に1へ循環します。ticksはJSONを読み取る段階で精度を保ち、内部ではbigintで保持します。描画時の数値変換のみ秒単位にします。
- Timer/Contextは750ms周期で再同期します。補間は最後の取得から最大2秒に制限し、RPCタイムアウトで再接続します。
- 全区間の比較・現在Attemptは復元可能です。過去すべてのAttempt履歴はv4にありません。
- 複数LiveSplitは各パーツのserver属性でポートを分けます。同じ接続先はRPC/Eventsの2接続を共有します。

### 表示計算の参照元

Splitsの列の表示分岐は公式の[SplitComponent.UpdateColumn](https://github.com/LiveSplit/LiveSplit.Splits/blob/master/src/LiveSplit.Splits/UI/Components/SplitComponent.cs)、差分計算は[LiveSplitStateHelper](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Model/LiveSplitStateHelper.cs)と照合しています。列の設定・表示条件は[列設定](components/splits/columns.md)にまとめています。

記録色の色相を一巡させる表現は公式の[GetBestSegmentColor](https://github.com/LiveSplit/LiveSplit/blob/master/src/LiveSplit.Core/Model/LiveSplitStateHelper.cs)を参考に、CSSで滑らかに変化させています。利用時の判定条件と変数は[記録色と状態色](css/record-colors.md)を参照してください。

## CIと自動リリース

GitHub ActionsはPR・mainへのpush・手動実行で、WindowsとLinux上のNode.js 24を使い、固定ロックファイルでの依存導入、公式Schemaからの再生成と差分確認、型チェック、ビルド、全テスト、配布ZIPの作成・内容検証を行います。`test:live`は起動中のLiveSplitが必要なためCIの対象外です。

バージョンの正本は `package.json` の `version`（`X.Y.Z`形式）です。mainのチェックがすべて成功した後、`vX.Y.Z`タグが存在しなければ、検証したコミットにタグを発行し、GitHub Releaseを自動公開します。既存タグがあれば公開をスキップし、タグ照会などの通信エラーは失敗として扱います。リリース処理は直列化され、PRからは公開しません。mainを指定した手動実行でも同じ処理を再試行できます。

配布物は `LiveSplit.WebLayout-vX.Y.Z.zip` と `SHA256SUMS.txt` です。ZIPには `dist/` のHTML・JS・CSS、README、ドキュメント、Bridge由来コードのライセンス、`VERSION.txt`を含めます。リリースジョブはCIで検証したZIPをそのまま使用します。ローカルでは `pnpm build` の後、PowerShell 7で `./scripts/package-release.ps1` を実行すると `artifacts/` に同じ形式で作成できます。

[目次](README.md)
