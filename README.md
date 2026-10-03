# LiveSplit.WebLayout

LiveSplit内蔵WebSocketサーバーの情報を表示するHTMLパーツ集です。TypeScript + Viteで開発し、配布後はNode.js・npm・HTTPサーバーなしで利用できます。操作コマンドは送信しません。

## ビルドと配布

開発者のみNode.js 22.12以降が必要です。

```sh
npm ci
npm run build
```

`dist/` に次のファイルを出力します。

| ファイル | 用途 |
| --- | --- |
| `livesplit.js` | パーツを登録する通常のJavaScript。`type="module"`不要 |
| `livesplit.css` | 任意の初期スタイル。編集・差し替え・省略可能 |
| `index.html` | 全パーツの配置例。レイアウトやデザインはこのHTMLで編集 |
| `timer.html` | OBS向けの透過タイマーだけの配置例 |

利用者には必要なHTMLとJS・CSSを同じフォルダーで渡します。LiveSplitで **Control → Start WS Server** を有効にし、HTMLをブラウザーで直接開いてください。OBSではブラウザソースの「ローカルファイル」でHTMLを選択します。`file://`での実動作は自動ブラウザーツールの制限により未検証です。通常のHTTP静的配信にも対応します。

配布物を編集しても再ビルドは不要です。ただし次のビルドで `dist/` は置き換わるため、自分のレイアウトは別フォルダーに保存してください。従来の単一HTML配布から変更しています。JS・CSSも一緒に配置してください。

## 好きなパーツを配置

```html
<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<link rel="stylesheet" href="./livesplit.css">
<script defer src="./livesplit.js"></script>

<livesplit-game></livesplit-game>
<livesplit-splits></livesplit-splits>
<livesplit-timer></livesplit-timer>
<p>比較との差 <livesplit-value field="delta"></livesplit-value></p>
<livesplit-status></livesplit-status>
</html>
```

| タグ | 表示内容 |
| --- | --- |
| `livesplit-timer` | 現在タイムと小数部 |
| `livesplit-game` | ゲーム名・カテゴリ |
| `livesplit-splits` | 区間名・比較差・累積タイムの表 |
| `livesplit-status` | 接続状態 |
| `livesplit-value field="…"` | 任意の単独項目 |

### 専用のUIコンポーネント

次のタグはラベルと値をセットで表示します。すべて独立配置・複製・`server`指定・独自HTMLの指定に対応し、既存の接続を共有します。

| タグ | 表示内容 |
| --- | --- |
| `livesplit-best-possible-time` | Best Possible Time（LiveSplitの最速完走予測） |
| `livesplit-delta` | 比較との差。先行・遅延で色分け |
| `livesplit-previous-split` | 直前に終了した区間の累積タイム（区間単体の所要時間ではありません） |
| `livesplit-comparison-time` | 現在区間の比較累積タイム |
| `livesplit-final-time` | 比較の最終タイム。終了後は完走タイムとそのラベルに切り替え |
| `livesplit-current-split` | 現在区間名 |
| `livesplit-previous-split-name` | 直前区間名 |
| `livesplit-split-progress` | 区間進捗 |
| `livesplit-attempts` | 挑戦回数 |
| `livesplit-completed-attempts` | 完走回数 |
| `livesplit-phase` | 待機中・計測中・一時停止・完走 |
| `livesplit-comparison` | 比較対象の名前 |
| `livesplit-timing-method` | Real Time / Game Time |

```html
<livesplit-best-possible-time label="最速完走予測"></livesplit-best-possible-time>
<livesplit-delta hide-label></livesplit-delta>
<livesplit-attempts label="Attempts"></livesplit-attempts>
```

`label`でラベルを変更、`hide-label`でラベルを非表示にできます。ラベル変更では通信を再接続しません。内部の `.ls-label` と `.ls-value` を通常のCSSで装飾でき、`--ls-label-size`（既定0.75rem）・`--ls-value-size`（既定1.5rem）も使えます。未取得や比較タイム未設定の場合は「—」です。専用タグを使っても、同等の`livesplit-value`を使っても数値の意味は変わりません。

不要なタグは削除し、自由に並べ替え・複製できます。同じ接続先のパーツは通信と走行履歴を共有します。最後のパーツを取り除くと接続を閉じます。独自のページ全体を書き換えたり、グローバルなIDに依存したりしません。

`field`に指定できる項目:

| field | 内容 |
| --- | --- |
| `time`, `whole`, `fraction` | 現在タイム全体・整数部・小数部 |
| `game`, `category`, `phase` | ゲーム名・カテゴリ・走行状態 |
| `method`, `comparison` | 計測方法・比較名 |
| `delta`, `best-possible`, `final-time`, `final-label` | 比較差・最速完走予測・最終タイム・その説明 |
| `current-split`, `previous-split`, `split-progress` | 現在区間・直前区間・進捗 |
| `split-target`, `last-split` | 現在区間の比較累積タイム・直前の実測累積タイム |
| `attempts`, `completed` | 挑戦・完走回数 |
| `status`, `endpoint`, `split-note`, `readout-note` | 接続状態・接続先・補足説明 |

## CSSと独自マークアップ

Shadow DOMを使わないため、通常のCSSセレクターですべて装飾できます。付属CSSはパーツ内のみを対象とし、bodyの背景・配置・余白を指定しません。

```html
<style>
  body { background: transparent; }
  livesplit-timer { --ls-timer-size: 96px; --ls-accent: white; }
  livesplit-splits { --ls-active-background: #345; --ls-ahead: lime; }
  livesplit-splits th, livesplit-splits td { padding: 4px 12px; }
</style>
```

主なCSS変数は `--ls-color`, `--ls-font`, `--ls-time-font`, `--ls-timer-size`, `--ls-accent`, `--ls-muted`, `--ls-border`, `--ls-active-background`, `--ls-ahead`, `--ls-behind` です。接続状態は各タグの `data-state="connecting|connected|disconnected|error"` に反映されます。

タグ内に独自HTMLを記述すると、既定のマークアップを生成せず、`data-ls-field` の箇所だけ更新します。名前は上のfield一覧と共通です。パーツ同士は入れ子にせず並べて配置してください。

```html
<livesplit-timer>
  <strong data-ls-field="whole"></strong><small data-ls-field="fraction"></small>
</livesplit-timer>
```

Splits表を独自に組む場合は、`tbody data-ls-field="splits"` を設けてください。そのtbodyの行はパーツが管理します。行には `active`、差分セルには `data-sign="ahead|behind"` が付くのでCSSで装飾できます。

## 接続先

既定は `ws://localhost:16834/livesplit`。各パーツの `server` 属性で指定できます。属性がない場合はページURLの `?server=…`、次に既定値の順で使用します。別の接続先を指定したパーツは別の通信を使います。

```html
<livesplit-timer server="ws://127.0.0.1:16834/livesplit"></livesplit-timer>
```

従来の `overlay=1` の代わりに `timer.html`、またはタイマーパーツだけを配置したHTMLを使ってください。

## データと互換性

- master対応版ではゲーム名・カテゴリ・全区間名を開始前から取得します。1.8.37など未対応のサーバーでは未取得項目は「—」、区間は取得できた範囲を表示します。
- Splits表は接続中に取得した区間結果を記録します。比較差は比較累積タイムを事前取得できた区間のみ表示します。取り逃した区間は推測しません。
- リセット・切断・再読み込み・最後のパーツ削除で履歴は消えます。区間巻き戻しでは該当区間以降の結果を消去します。
- 計測方法や比較を走行中に切り替えた場合はページを再読み込みしてください。
- タイマーはLiveSplitの計測方法に従い、取得間隔は応答後約33ms。ローカルで時刻を進める補間は行いません。
- 同じ接続先ごとにタイマーと補助情報の2接続を使用し、それぞれ同時リクエストは1件です。
- ゲーム名など外部の文字列はHTMLとして解釈せずテキストとして表示します。

## 開発・検証

```sh
npm run dev
npm run build
npm test
npm run test:live
```

`test:live`は起動中のLiveSplitに対する読み取り専用テストです。接続先は環境変数 `LIVESPLIT_URL` で変更できます。`npx tsx tests/mock-server.ts` では固定データのテストサーバーを起動します。

実装は `src/components.ts`（パーツ）、`src/session.ts`（共有接続）、`src/parts.css`（既定CSS）、`src/readout.ts` / `src/splits.ts`（表示・履歴）、`src/timer.ts`（通信）です。配置例はルートの `index.html` から出力されます。

仕様: [LiveSplit公式README](https://github.com/LiveSplit/LiveSplit#the-livesplit-server)。サードパーティーのJSON形式WebSocketプラグインは対象外です。
