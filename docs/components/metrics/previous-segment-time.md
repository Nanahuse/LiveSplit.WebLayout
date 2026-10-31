# Previous Segment Time

`<livesplit-previous-segment-time>` — 直前に終了した区間の実測所要時間です。

## 最小使用例

```html
<livesplit-previous-segment-time></livesplit-previous-segment-time>
```

## カスタマイズ例

```html
<livesplit-previous-segment-time label="直前の区間タイム" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-previous-segment-time>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。型・既定の配置は[共通設定](../common.md)を参照してください。

[記録色・状態色の対象とタイミング](../../css/record-colors.md)も参照してください。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートの値は`data-ls-field="previous-segment-time"`です。ラベル不要なら`<livesplit-value field="previous-segment-time"></livesplit-value>`でも表示できます。

## 動作・制限

累積タイムや比較差分ではありません。直前区間がスキップされ実測値がない場合は「—」です。

[共通設定](../common.md) / [部品一覧](../README.md)
