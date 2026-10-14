# 導入・配置

開発者のみNode.js 22.12以降とpnpm 12.9.1が必要です。

```sh
pnpm install --frozen-lockfile
pnpm run build
```

`dist/` に次のファイルを出力します。

| ファイル | 用途 |
| --- | --- |
| `livesplit.js` | パーツを登録する通常のJavaScript。`type="module"`不要 |
| `livesplit.css` | 任意の初期スタイル。編集・差し替え・省略可能 |
| `index.html` | 全パーツの配置例。レイアウトやデザインはこのHTMLで編集 |
| `timer.html` | OBS向けの透過タイマーだけの配置例 |

LiveSplitにローカルファイルからの接続に対応したProtocol v3のLiveSplit.Bridgeを追加して起動してください。RPCの既定接続先は `ws://127.0.0.1:54000/bridge/v3/rpc`、Eventsは同じポートの `/bridge/v3/events` です。

ブラウザーで `dist/index.html` を直接開いてください。OBSではブラウザソースの「ローカルファイル」を有効にして `dist/index.html` または透過タイマーの `dist/timer.html` を指定します。HTTP経由での表示も引き続き利用できます。

配布物を編集しても再ビルドは不要です。ただし次のビルドで `dist/` は置き換わるため、自分のレイアウトは別フォルダーに保存してください。従来の単一HTML配布から変更しています。JS・CSSも一緒に配置してください。

## HTMLへの配置

```html
<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<link rel="stylesheet" href="./livesplit.css">
<script defer src="./livesplit.js"></script>

<livesplit-game></livesplit-game>
<livesplit-splits></livesplit-splits>
<livesplit-timer></livesplit-timer>
<p>比較との差 <livesplit-value field="delta"></livesplit-value></p>
<livesplit-status></livesplit-status>
</html>
```

| タグ | 表示内容 |
| --- | --- |
| `livesplit-timer` | 現在タイムと小数部 |
| `livesplit-game` | ゲーム名・カテゴリ |
| `livesplit-splits` | 区間名・比較差・累積タイムの表 |
| `livesplit-status` | 接続状態 |
| `livesplit-value field="…"` | 任意の単独項目 |

部品は削除・並べ替え・複製できます。パーツ同士は入れ子にせず、並べて配置してください。同じ接続先のパーツは通信を共有します。

[コンポーネント一覧](components/README.md) / [CSS設定](css/README.md) / [目次](README.md)
