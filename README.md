# LiveSplit.WebLayout

LiveSplitのタイマーや区間表をHTMLとCSSで配置・装飾できる表示用コンポーネント集です。ブラウザーやOBSで、自分の配信レイアウトを表示できます。

## できること

- 全体・区間タイマー、区間表、比較差分、短縮可能時間、完走予測を組み合わせる。
- ゲーム名、カテゴリ、挑戦回数、Custom Variableなどを表示する。
- JavaScriptでSplitの結果を受け取り、LiveSplitの進行に合わせて表示を切り替える。
- HTMLで部品を追加・並べ替え、属性とCSSで文字・色・配置を調整する。

計測や操作はLiveSplit側で行います。このプロジェクトはLiveSplit.Bridgeから情報を受け取り、表示します。

## 使い始める

1. [GitHub Releases](https://github.com/Nanahuse/LiveSplit.WebLayout/releases)から `LiveSplit.WebLayout-vX.Y.Z.zip` をダウンロードし、展開します。
2. LiveSplitに、ローカルファイルからの接続に対応したJSON Protocol v4のLiveSplit.Bridgeを追加して起動します。
3. 展開したフォルダーの `dist/index.html` をブラウザーで開きます。OBSではブラウザソースの「ローカルファイル」に指定します。

利用時のNode.js・pnpm・HTTPサーバーは不要です。接続先や配布ファイルの説明は[導入ガイド](docs/getting-started.md)を参照してください。

## サンプル

- `dist/index.html` はタイマー、区間表、各種メトリクスをまとめて表示します。[コンポーネント一覧](docs/components/README.md)
- `dist/split-result.html` は区間名、確定タイム、取得できた比較差分を表示し、2.5秒後にタイマーへ戻ります。[OBSでの設定](docs/getting-started.md#4-obsに表示する) / [JavaScriptの実装例](docs/javascript-api.md#split結果の表示例)

## 自分のレイアウトを作る

配布物のHTML・JS・CSSを別フォルダーへコピーし、HTMLを編集します。部品を追加するところから装飾・保存まで、[カスタマイズガイド](docs/customization.md)で説明しています。

## ドキュメント

| 目的 | 読むページ |
| --- | --- |
| 初めて表示する | [導入ガイド](docs/getting-started.md) |
| レイアウトを作る・変更する | [カスタマイズ](docs/customization.md) |
| 状態・時計・操作を購読する | [JavaScript API](docs/javascript-api.md) |
| 必要な部品を探す | [コンポーネント一覧](docs/components/README.md) |
| 色・文字・枠を細かく設定する | [CSS設定](docs/css/README.md) |
| 接続先を変える・複数のLiveSplitを使う | [接続設定](docs/connection.md) |
| 表示や接続の問題を解決する | [トラブルシューティング](docs/troubleshooting.md) |
| 公式LiveSplitとの違いを確認する | [対応範囲](docs/compatibility.md) |
| ソースからビルド・開発する | [開発・検証](docs/development.md) |

読む順序と詳細な案内は[ドキュメント目次](docs/README.md)にまとめています。
