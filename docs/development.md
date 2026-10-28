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

[目次](README.md)
