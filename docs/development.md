# 開発・検証

```sh
pnpm run dev
pnpm run generate:protocol
pnpm run build
pnpm test
pnpm run test:live
```

`test:live`は起動中のBridge v3への読み取り専用検証です。接続先は環境変数 `LIVESPLIT_URL` で変更できます。Start/Split/Reset等の操作RPCは送りません。`pnpm exec tsx tests/mock-server.ts` は54001番ポートのバイナリv3フィクスチャです。

通信層は `src/bridge-client.ts`、表示モデルへの変換は `src/bridge-state.ts`、パーツは `src/components.ts`、共通CSSは `src/parts.css`。Protocolの正本は `proto/`、生成元の固定コミットは `proto/SOURCE.json`、生成コードは `src/generated/` です。生成にはbufとprotoc-gen-esを使い、配布JSにProtobufランタイムもバンドルします。

コマンドはリポジトリのルートで実行します。依存関係の初期導入は `pnpm install --frozen-lockfile` です。

[目次](README.md)
