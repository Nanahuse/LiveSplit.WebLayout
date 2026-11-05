# ドキュメント

LiveSplitの表示をブラウザー・OBSで使い、HTMLとCSSでレイアウトを作るためのガイドです。

## 初めて使う

1. [導入ガイド](getting-started.md)で配布ZIPを取得し、LiveSplit.Bridgeを準備して表示します。
2. [カスタマイズ](customization.md)で部品を並べ、ラベルや文字サイズを変え、自分のレイアウトを保存します。
3. 必要な表示を[コンポーネント一覧](components/README.md)から探し、詳細な設定を確認します。

基本的なレイアウト作成には最初の2ページを順に読んでください。

## 目的から探す

| やりたいこと | 参照先 |
| --- | --- |
| タイマー・区間表・情報表示を追加する | [コンポーネント一覧](components/README.md)（各部品へ直接移動できます） |
| ラベル・共通属性を調べる | [部品の共通設定](components/common.md) |
| 枠・文字・背景・配置を調整する | [CSS設定](css/README.md)・[共通変数](css/common.md) |
| PB・Best Segment・状態の色を変える | [記録色と状態色](css/record-colors.md) |
| 自分のHTML構造で表示する | [独自HTMLテンプレート](components/custom-markup.md) |
| 区間表の列・行数・装飾を変更する | [Splits](components/splits/README.md) |
| 区間をグループ化する | [Subsplits](components/splits/subsplits.md) |
| 接続先を変更する・複数のLiveSplitを表示する | [接続設定](connection.md) |
| 表示されない・接続できない・設定が反映されない | [トラブルシューティング](troubleshooting.md) |
| 公式との機能差・制限や旧設定を確認する | [対応範囲と移行](compatibility.md) |

## 開発・保守する

[開発・検証](development.md)に、開発環境、ビルド・テスト、通信の内部設計、CI・リリースをまとめています。

[リポジトリのREADMEへ](../README.md)
