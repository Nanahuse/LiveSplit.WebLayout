# Current Split

`<livesplit-current-split>` — 現在区間の名前です。待機中は最初の区間、完走後は「すべての区間が終了」と表示します。

## 配置・ラベル

```html
<livesplit-current-split label="現在の区間" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-current-split>
```

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="current-split"`です。ラベル不要なら`<livesplit-value field="current-split"></livesplit-value>`でも表示できます。

[共通設定](../common.md) / [部品一覧](../README.md)
