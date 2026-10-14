# CSS設定

付属の `livesplit.css` は任意です。Shadow DOMを使わないため、部品の内部も通常のCSSで装飾できます。付属CSSはbodyの背景やページ全体の配置を指定しません。

- [共通の枠・文字・配置](common.md)
- [PB・Best Segment・タイマー状態色](record-colors.md)
- [独自HTMLテンプレート](../components/custom-markup.md)
- [部品別のCSSと設定](../components/README.md)

付属CSSの後に独自CSSを読み込んでください。

```html
<link rel="stylesheet" href="./livesplit.css">
<link rel="stylesheet" href="./custom.css">
<script defer src="./livesplit.js"></script>
```

同種の部品を個別に装飾する場合はclassを付けます。共通変数は親から継承させることもできます。表示値や状態をJavaScriptで書き換える必要はありません。

[目次](../README.md)
