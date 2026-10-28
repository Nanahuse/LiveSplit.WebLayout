# 開発・検証

```sh
pnpm run dev
pnpm run generate:protocol
pnpm run build
pnpm test
pnpm run test:live
```

`test:live`は起動中のBridge v4への読み取り専用検証です。接続先は環境変数 `LIVESPLIT_URL` で変更できます。Start/Split/Reset等の操作RPCは送りません。`pnpm exec tsx tests/mock-server.ts` は54001番ポートのJSON v4フィクスチャです。

通信層は `src/bridge-client.ts`、JSONの検証・変換は `src/bridge-protocol.ts`、表示モデルへの変換は `src/bridge-state.ts`、パーツは `src/components.ts`、共通CSSは `src/parts.css`。公式JSON Schemaは `schemas/v4/`、取得元の固定コミットは `schemas/SOURCE.json`、生成コードは `src/generated/protocol.ts` です。`generate:protocol` はNode.jsだけで内部のcamelCase型と検証用定義を生成します。wireのnullable値は内部ではundefined、ticksはbigintとして扱います。Protobufランタイムは不要です。

コマンドはリポジトリのルートで実行します。依存関係の初期導入は `pnpm install --frozen-lockfile` です。

[目次](README.md)
