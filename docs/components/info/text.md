# Text

固定テキスト、走行情報、Custom Variableを左右に配置します。

```html
<livesplit-text left="走行者" right="Player"></livesplit-text>
<livesplit-text left="比較対象" right-field="comparison"></livesplit-text>
<livesplit-text left="Deaths" right-variable="Deaths"
  style="--ls-text-right-color:gold"></livesplit-text>
```

## 属性・settings

| 指定 | 内容 |
|---|---|
| `left` / `right` | 固定テキスト |
| `left-field` / `right-field` | [Valueのfield](value.md)を表示 |
| `left-variable` / `right-variable` | ContextのCustom Variable名 |
| `settings.Text1` / `Text2` | 左／右の固定テキスト。既定空文字。属性が優先 |
| `settings.CustomVariable` | 既定false。trueでText2（right指定時はその値）を右側の変数名として解釈 |
| `settings.Display2Rows` | 既定false。trueで2行配置 |

明示したvariable属性はsettingsの変数名に優先します。値の選択順はvariable → field → 固定テキストです。片側だけなら中央寄せになります。

```html
<livesplit-text settings='{"Text1":"Deaths","Text2":"Death Count","CustomVariable":true,"Display2Rows":true}'></livesplit-text>
```

変数名は大文字・小文字・空白を保持します。空の名前・改行は設定エラーです。未設定値は「—」、空文字や「-」はそのまま表示し、HTMLとして実行しません。Context変更イベントと750ms周期の再同期で更新します。本体Counterの内部カウンターとは別です。固定Textのみなら通信せず`data-state="static"`になります。

## CSS

| 変数・対象 | 用途 |
|---|---|
| `--ls-text-left-color` / `--ls-text-right-color` | 左右の文字色。既定inherit |
| `--ls-text-left-font` / `--ls-text-right-font` | 左右のfont指定。既定inherit。例: bold 20px sans-serif |
| `--ls-content-gap` | 左右／2行の間隔。既定1em |
| `.ls-text` / `[data-text-side="left"]` / `[data-text-side="right"]` | 全体と左右の更新対象 |

独自HTMLでは`data-text-side="left"` / `"right"`を残すと属性の設定が反映されます。

[共通設定](../common.md) / [部品一覧](../README.md)
