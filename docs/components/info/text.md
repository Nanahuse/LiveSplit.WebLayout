# Text

固定テキスト、走行情報、Custom Variableを左右に配置します。

## 最小使用例

```html
<livesplit-text left="走行者" right="Player"></livesplit-text>
```

## カスタマイズ例

```html
<livesplit-text left="走行者" right="Player"></livesplit-text>
<livesplit-text left="比較対象" right-field="comparison"></livesplit-text>
<livesplit-text left="Deaths" right-variable="Deaths"
  style="--ls-text-right-color:gold"></livesplit-text>
```

```html
<livesplit-text settings='{"Text1":"Deaths","Text2":"Death Count","CustomVariable":true,"Display2Rows":true}'></livesplit-text>
```

## 属性・settings

| 指定 | 型 | 省略時・既定値 | 内容 |
| --- | --- | --- | --- |
| `left` / `right` | 文字列属性 | Text1 / Text2 | 固定テキスト。属性がsettingsより優先 |
| `left-field` / `right-field` | 文字列属性 | 指定なし | [Valueのfield](value.md)を表示 |
| `left-variable` / `right-variable` | 文字列属性 | 指定なし | ContextのCustom Variable名 |
| `settings.Text1` / `Text2` | 文字列 | 空文字 | 左／右の固定テキスト |
| `settings.CustomVariable` | 真偽値 | false | trueでText2（right指定時はその値）を右側の変数名として解釈 |
| `settings.Display2Rows` | 真偽値 | false | trueで2行配置 |

明示したvariable属性はsettingsの変数名に優先します。値の選択順はvariable → field → 固定テキストです。片側だけなら中央寄せになります。

## CSS・独自HTML

| 変数・対象 | 用途 |
|---|---|
| `--ls-text-left-color` / `--ls-text-right-color` | 左右の文字色。既定inherit |
| `--ls-text-left-font` / `--ls-text-right-font` | 左右のfont指定。既定inherit。例: bold 20px sans-serif |
| `--ls-content-gap` | 左右／2行の間隔。既定1em |
| `.ls-text` / `[data-text-side="left"]` / `[data-text-side="right"]` | 全体と左右の更新対象 |

独自HTMLでは`data-text-side="left"` / `"right"`を残すと属性の設定が反映されます。

## 動作・制限

属性もsettingsも指定しない場合は空の固定Textになります。

変数名は大文字・小文字・空白を保持します。空の名前・改行は設定エラーです。未設定値は「—」、空文字や「-」はそのまま表示し、HTMLとして実行しません。Context変更イベントと750ms周期の再同期で更新します。本体Counterの内部カウンターとは別です。固定Textのみなら通信せず`data-state="static"`になります。

[共通設定](../common.md) / [部品一覧](../README.md)
