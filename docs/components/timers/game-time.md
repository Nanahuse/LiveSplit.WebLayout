# Game Time

`<livesplit-game-time>` はGame Timeを表示します。

## 最小使用例

```html
<livesplit-game-time></livesplit-game-time>
```

## カスタマイズ例

```html
<livesplit-game-time label="Game Time" layout="row"
  style="--ls-value-size:28px; --ls-label-size:14px"></livesplit-game-time>
```

## 属性・settings

`label`でラベル変更、`hide-label`でラベル非表示、`layout="row"`で左右配置にできます。属性の型と既定の配置は[共通設定](../common.md)を参照してください。

この部品固有のsettingsはありません。

## CSS・独自HTML

ラベルは`.ls-label`、値は`.ls-value`です。`--ls-label-size` / `--ls-label-color` / `--ls-label-font`、`--ls-value-size` / `--ls-value-color` / `--ls-value-font`、`--ls-label-gap`を利用できます。枠・背景・余白は[共通CSS](../../css/common.md)を参照してください。

独自テンプレートでは値を表示する要素に`data-ls-field="game-time"`を指定します。ラベルが不要なら`<livesplit-value field="game-time"></livesplit-value>`でも表示できます。

## 動作・制限

未初期化・未設定なら「—」です。TimerStateを750ms周期で再同期し、Game Timeが進行中のときだけ補間します。Game TimeだけPause中なら固定します。

[共通設定](../common.md) / [部品一覧](../README.md)
