# コンポーネント一覧

表示したい内容から部品を選べます。タグをHTMLに配置するだけで既定の表示を使えます。初めてレイアウトを作る場合は[カスタマイズ](../customization.md)、共通の属性は[部品の共通設定](common.md)を参照してください。

## 時計

| コンポーネント | タグ | 表示するもの |
| --- | --- | --- |
| [Timer](timers/timer.md) | `livesplit-timer` | 選択中の計測方法による全体タイム |
| [Detailed Timer](timers/detailed-timer.md) | `livesplit-detailed-timer` | 全体・区間タイマー、区間名、2つの比較区間タイム |
| [Segment Timer](timers/segment-timer.md) | `livesplit-segment-timer` | 現在区間の経過時間 |
| [Real Time](timers/real-time.md) | `livesplit-real-time` | 選択中の計測方法にかかわらずReal Time |
| [Game Time](timers/game-time.md) | `livesplit-game-time` | Game Time。未初期化・未設定なら「—」 |

## 区間表

| コンポーネント | タグ | 表示するもの |
| --- | --- | --- |
| [Splits](splits/README.md) | `livesplit-splits` | 区間名、タイム、比較差分を列で表示 |
| [Subsplits](splits/subsplits.md) | `livesplit-subsplits` | 区間のグループ化、自動展開・折りたたみ、見出しとグループ時計 |

Splitsの詳細: [列の種類・比較対象](splits/columns.md) / [表示行数・精度](splits/settings.md) / [枠・列幅・CSS](splits/style.md)。

## 時間・差分・予測

| コンポーネント | タグ | 表示するもの |
| --- | --- | --- |
| [Previous Segment](metrics/previous-segment.md) | `livesplit-previous-segment` | 直前区間の比較差分。条件成立後は現在区間の差分 |
| [Previous Segment Time](metrics/previous-segment-time.md) | `livesplit-previous-segment-time` | 直前区間の実測所要時間 |
| [Possible Time Save](metrics/possible-time-save.md) | `livesplit-possible-time-save` | 現在区間または残り全体の短縮可能時間 |
| [Live Segment](metrics/live-segment.md) | `livesplit-live-segment` | 現在区間の比較差分 |
| [Current Pace](metrics/current-pace.md) | `livesplit-current-pace` | 選択中の比較を使った完走予測 |
| [Sum Of Best](metrics/sum-of-best.md) | `livesplit-sum-of-best` | Best Segments比較の最終累積タイム |
| [Best Possible Time](metrics/best-possible-time.md) | `livesplit-best-possible-time` | 個別Best Segmentを使った最速完走予測 |
| [Delta](metrics/delta.md) | `livesplit-delta` | 選択中比較に対する累積差分 |
| [Previous Split](metrics/previous-split.md) | `livesplit-previous-split` | 直前区間までの累積実測タイム |
| [Comparison Time](metrics/comparison-time.md) | `livesplit-comparison-time` | 現在区間の比較累積タイム |
| [Final Time](metrics/final-time.md) | `livesplit-final-time` | 比較の最終タイム。完走後は実測の完走タイム |

## 名前・状態・回数・テキスト

| コンポーネント | タグ | 表示するもの |
| --- | --- | --- |
| [Game](info/game.md) | `livesplit-game` | ゲーム名・カテゴリ |
| [Text](info/text.md) | `livesplit-text` | 固定文字列、走行情報、Custom Variableを左右または2行で表示 |
| [Status](info/status.md) | `livesplit-status` | 接続中・接続済み・再接続待ちや設定エラー |
| [Value](info/value.md) | `livesplit-value` | fieldで選んだ単独項目をラベルなしで表示 |
| [Hotkey Indicator](info/hotkey-indicator.md) | `livesplit-hotkey-indicator` | 現状は未知色の線と「取得不可」。Bridge v4の制限あり |
| [Current Split](info/current-split.md) | `livesplit-current-split` | 現在区間の名前 |
| [Previous Split Name](info/previous-split-name.md) | `livesplit-previous-split-name` | 直前区間の名前 |
| [Split Progress](info/split-progress.md) | `livesplit-split-progress` | 終了した区間数と全区間数 |
| [Attempts](info/attempts.md) | `livesplit-attempts` | 挑戦回数 |
| [Completed Attempts](info/completed-attempts.md) | `livesplit-completed-attempts` | 完走回数 |
| [Phase](info/phase.md) | `livesplit-phase` | 待機中・計測中・一時停止・完走 |
| [Comparison](info/comparison.md) | `livesplit-comparison` | 選択中の比較対象名 |
| [Timing Method](info/timing-method.md) | `livesplit-timing-method` | 選択中の計測方法名（Real Time / Game Time） |

## 共通リファレンス

- [共通属性・ラベル・配置](common.md)
- [独自HTMLテンプレート](custom-markup.md)
- [CSS設定](../css/README.md)・[記録色と状態色](../css/record-colors.md)
- [公式との機能差・制限](../compatibility.md)

[ドキュメント目次](../README.md)
