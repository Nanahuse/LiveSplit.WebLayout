# Sum Of Best

`<livesplit-sum-of-best>` — RunStateのBest Segments比較の最終累積タイムです。

## 最小使用例

```html
<livesplit-sum-of-best></livesplit-sum-of-best>
```

## カスタマイズ例

```html
<livesplit-sum-of-best label="Sum of Best" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-sum-of-best>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="sum-of-best"`です。ラベル不要なら`<livesplit-value field="sum-of-best"></livesplit-value>`でも表示できます。

## 動作・制限

完走後の接続でも復元できます。本体の全Attempt履歴を使った走行中再計算とは異なる場合があります。

[共通設定](../common.md) / [部品一覧](../README.md)
