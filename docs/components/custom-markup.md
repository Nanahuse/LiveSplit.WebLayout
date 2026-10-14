# 独自HTMLテンプレート

タグ内に子要素を置くと既定テンプレートは生成されません。`data-ls-field`を付けた要素のテキストを更新します。対象フィールドは[Value](info/value.md)を参照してください。装飾要素を維持したい場合は更新対象の外側に置きます。

```html
<livesplit-timer>
  <strong data-ls-field="whole"></strong><small data-ls-field="fraction"></small>
</livesplit-timer>
```

ラベル付き部品では`.ls-label`に`label` / `hide-label`が適用されます。

```html
<livesplit-best-possible-time label="最速予測">
  <span class="ls-label"></span>
  <strong data-ls-field="best-possible"></strong>
</livesplit-best-possible-time>
```

Splits / Subsplitsでは`tbody data-ls-field="splits"`と`thead`内の`tr data-ls-field="split-head"`を用意します。この行・見出しの中身は部品が管理します。

```html
<livesplit-splits>
  <table class="ls-splits">
    <thead><tr data-ls-field="split-head"></tr></thead>
    <tbody data-ls-field="splits"></tbody>
  </table>
</livesplit-splits>
```

Detailed Timerの小数・比較欄、Textの左右欄などには専用の属性があります。各部品ページのCSS対象・テンプレート要素を参照し、必要な要素を残してください。独自HTMLでは配置も自分のCSSで指定します。パーツ同士は入れ子にしないでください。

[部品一覧](README.md)
