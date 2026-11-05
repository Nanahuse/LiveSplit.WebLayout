# Subsplits

区間をグループ化し、自動で展開・折りたたみする表です。通常のSplitsと同じBridge接続を共有する表示専用パーツです。

## 最小使用例

```html
<livesplit-subsplits></livesplit-subsplits>
```

## カスタマイズ例

```html
<livesplit-subsplits settings='{"ShowColumnLabels":true,"VisualSplitCount":8,"ShowHeader":true}'></livesplit-subsplits>
```

## LiveSplit側の区間名

公式の名前ルールで、連続する`-`付き区間と、その次の主要区間を1グループにします。例えば次の区間名をLiveSplit側で登録します。

```text
-道中1
-道中2
{ステージ1}ボス
-道中
{ステージ2}ボス
```

`{ステージ1}ボス`は見出し・折りたたみ時に「ステージ1」、展開時に「ボス」を表示します。通常の主要区間名も使えます。最終行は先頭に`-`があっても主要区間として扱います。多段の入れ子構造ではありません。

## 属性・settings

| 設定 | 型 | 既定値・意味 |
| --- | --- | --- |
| `ShowSubsplits` / `HideSubsplits` | 真偽値 | 両方false：現在グループのみ展開。前者true：全展開、後者true：全折りたたみ。同時trueはエラー |
| `CurrentSectionOnly` | 真偽値 | false。他グループの主要行を省略。全展開時は無効。最終区間固定は別設定 |
| `MinimumMajorSplits` | 整数 | 0。自動展開時、直前の主要区間のために行数を確保 |
| `ShowHeader` | 真偽値 | true。現在グループの見出しを追加。表示行数に含む |
| `HeaderText` / `HeaderTimes` / `SectionTimer` | 真偽値 | true。見出しの名前／比較時間または差分／グループ時計 |
| `HeaderComparison` / `HeaderTimingMethod` | 文字列 | Current Comparison / Current Timing Method |
| `HeaderAccuracy` / `SectionTimerAccuracy` | 文字列 | Tenths |
| `IndentSubsplits` / `IndentSectionSplit` | 真偽値 | true。子区間と展開中のグループ最終行を字下げ |

列設定・計測方式・表示行数・先読み・最終区間固定・幅・精度などはSplitsと共通です。細い区切り線の既定値は公式Subsplitsに合わせてfalseです。狭い表示行数では最終行を優先し、余裕がある場合に見出しを追加します。

## CSS・独自HTML

共通のSplits用CSS変数に加え、`--ls-subsplit-indent`、`--ls-header-background`、`--ls-header-color`、`--ls-header-weight`、`--ls-section-timer-color`、`--ls-section-gap`、`--ls-collapsed-background`を設定できます。`data-section-index` / `data-section-start` / `data-section-end` / `data-collapsed` / `data-section-header`で行別に装飾できます。

| CSS変数 | 既定値 |
|---|---|
| `--ls-subsplit-indent` | 1.8em |
| `--ls-header-background` / `--ls-header-color` / `--ls-header-weight` | #ffffff12 / inherit / 600 |
| `--ls-section-timer-color` / `--ls-section-gap` | inherit / 1em |
| `--ls-collapsed-background` | transparent |

独自の表構造を使う場合は[独自HTMLテンプレート](../custom-markup.md)を参照してください。

## 動作・制限

折りたたみ行の`Segment Time` / `Segment Delta`はグループ全体の時間・差分です。ライブ差分はグループ差分が正になるか、累積差分列で比較累積タイムを超えた場合に表示します。境界の実測・比較値が欠損している場合は遡って補わず「—」です。折りたたみ行はグループの先行・遅延色を使い、単一区間のBest Segment色を流用しません。常時表示の拡張列とCustom Variableは、グループ最終区間の値を表示します。

[公式Subsplits](https://github.com/LiveSplit/LiveSplit.Subsplits)のグループ解析・行選択・時間計算を参照しています。アイコン、文字の自動省略候補、ネイティブ描画固有の影・グラデーション設定、LiveSplit側の手動スクロールイベントの同期は未対応です。配色・装飾はCSSを使用してください。

[列設定](columns.md) / [表示設定](settings.md) / [装飾](style.md) / [部品一覧](../README.md)
