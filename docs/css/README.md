# CSS設定

文字・色・枠を初めて変える場合は、[カスタマイズ](../customization.md)の例から始めてください。このセクションではCSS変数と対象要素を調べられます。

## CSSの読み込み

付属の `livesplit.css` は任意です。独自CSSは付属CSSの後に読み込みます。

```html
<link rel="stylesheet" href="./livesplit.css">
<link rel="stylesheet" href="./custom.css">
<script defer src="./livesplit.js"></script>
```

同種の部品を個別に装飾する場合はclassを付けます。共通変数は親から継承させることもできます。表示値や状態をJavaScriptで書き換える必要はありません。

Shadow DOMを使わないため、部品の内部も通常のCSSで装飾できます。付属CSSはbodyの背景・配置・余白を指定しません。ページ全体のレイアウトはHTML側のCSSで指定します。

## リファレンス

| 調整したいもの | 参照先 |
| --- | --- |
| 共通の枠・文字・配置と変数の既定値 | [共通CSS変数](common.md) |
| PB・Best Segment・タイマー状態の色 | [記録色と状態色](record-colors.md) |
| 特定の部品だけの変数 | [コンポーネント一覧](../components/README.md)から各部品のCSS節へ |
| 区間表の幅・列幅・余白 | [Splitsの装飾](../components/splits/style.md) |
| 部品内部のHTML構造 | [独自HTMLテンプレート](../components/custom-markup.md) |

[カスタマイズ](../customization.md) / [目次](../README.md)
