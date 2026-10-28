# 開発・検証

```sh
pnpm run dev
pnpm run generate:protocol
pnpm run build
pnpm test
pnpm run test:live
```

`test:live`は起動中のBridge v4への読み取り専用検証です。接続先は環境変数 `LIVESPLIT_URL` で変更できます。Start/Split/Reset等の操作RPCは送りません。`pnpm exec tsx tests/mock-server.ts` は54001番ポートのJSON v4フィクスチャです。

通信層は `src/bridge-client.ts`、JSONの検証・変換は `src/bridge-protocol.ts`、表示モデルへの変換は `src/bridge-state.ts`、パーツは `src/components.ts`、共通CSSは `src/parts.css`。公式JSON Schemaはリポジトリに保存せず、`schemas/SOURCE.json` に取得元・固定コミット・参照パスを記録します。`generate:protocol` はGitHub上の固定コミットからSchemaをメモリ上に取得し、内部のcamelCase型と検証用定義を `src/generated/protocol.ts` に生成します。SchemaのJSONファイルは書き出しません。生成時にはNode.jsとインターネット接続が必要です。

生成済みのコードを保存しているため、通常のビルド・テストや配布HTMLの表示時にはSchemaを取得しません。表示にNode.js・HTTPサーバー・インターネット接続は不要です。wireのnullable値は内部ではundefined、ticksはbigintとして扱います。Protobufランタイムは不要です。

コマンドはリポジトリのルートで実行します。依存関係の初期導入は `pnpm install --frozen-lockfile` です。

## CIと自動リリース

GitHub ActionsはPR・mainへのpush・手動実行で、WindowsとLinux上のNode.js 24を使い、固定ロックファイルでの依存導入、公式Schemaからの再生成と差分確認、型チェック、ビルド、全テスト、配布ZIPの作成・内容検証を行います。`test:live`は起動中のLiveSplitが必要なためCIの対象外です。

バージョンの正本は `package.json` の `version`（`X.Y.Z`形式）です。mainのチェックがすべて成功した後、`vX.Y.Z`タグが存在しなければ、検証したコミットにタグを発行し、GitHub Releaseを自動公開します。既存タグがあれば公開をスキップし、タグ照会などの通信エラーは失敗として扱います。リリース処理は直列化され、PRからは公開しません。mainを指定した手動実行でも同じ処理を再試行できます。

配布物は `LiveSplit.WebLayout-vX.Y.Z.zip` と `SHA256SUMS.txt` です。ZIPには `dist/` のHTML・JS・CSS、README、ドキュメント、Bridge由来コードのライセンス、`VERSION.txt`を含めます。リリースジョブはCIで検証したZIPをそのまま使用します。ローカルでは `pnpm build` の後、PowerShell 7で `./scripts/package-release.ps1` を実行すると `artifacts/` に同じ形式で作成できます。

[目次](README.md)
