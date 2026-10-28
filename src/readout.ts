import { formatTime } from './timer.ts';
import type { ReadField } from './timer.ts';
import { Comparisons } from './comparisons.ts';
import { renderSplits } from './split-view.ts';
import { SplitHistory } from './splits.ts';

// Display model only. These value keys are not wire commands.
export class RunReadout {
  readonly history = new SplitHistory();
  readonly comparisons = new Comparisons();
  liveTime = '—';
  readonly values = new Map<ReadField, string>();
  readonly names = new Map<number, string>();
  readonly methods = new Map<string, RunReadout>();
  readonly bestSegments = new Map<number, number | null>();
  readonly segmentVariables = new Map<number, Record<string, string>>();
  attemptFresh = true;
  get count(): number { return Number(this.values.get('getsplitcount') ?? 0); }
  clear() { this.history.clear(); this.comparisons.clear(); this.values.clear(); this.names.clear(); this.methods.clear(); this.bestSegments.clear(); this.segmentVariables.clear(); this.liveTime = '—'; }
  get referenceIndex() { return this.history.phase === 'Ended' ? this.history.index - 1 : Math.max(0, this.history.index); }
}

export function displayTime(value?: string, delta = false): string {
  const time = value ? formatTime(value) : null;
  if (!time) return '—';
  return `${delta && !time.whole.startsWith('-') ? '+' : ''}${time.whole}${time.fraction}`;
}

export function splitSummary(run: RunReadout) {
  const phase = run.values.get('getcurrenttimerphase');
  const index = Number(run.values.get('getsplitindex') ?? -1);
  const waiting = phase === 'NotRunning';
  const ended = phase === 'Ended';
  return {
    current: waiting ? run.names.get(0) ?? '開始待ち' : ended ? 'すべての区間が終了' : run.values.get('getcurrentsplitname') ?? '—',
    previous: waiting ? '—' : run.values.get('getprevioussplitname') ?? '—',
    progress: run.count ? `${ended ? run.count : Math.max(0, Math.min(index, run.count))} / ${run.count} 区間終了`
      : waiting ? '開始待ち' : ended ? '完走' : index >= 0 ? `第 ${index + 1} 区間` : '取得待ち',
    note: [
      waiting ? run.count > 0 ? '計測開始前の区間一覧です。開始すると現在区間とタイムが更新されます。' : 'LiveSplit で計測を開始すると現在区間が表示されます。' : '',
    ].filter(Boolean).join(' '),
  };
}

export function renderReadout(run: RunReadout, root: ParentNode) {
  const set = (id: string, text: string) => { for (const element of root.querySelectorAll(`[data-ls-field="${id}"]`)) element.textContent = text; };
  const get = (command: ReadField) => run.values.get(command);
  const phase = get('getcurrenttimerphase');
  const summary = splitSummary(run);
  const phases: Record<string, string> = { NotRunning: '待機中', Running: '計測中', Paused: '一時停止', Ended: '完走' };
  set('hotkey-status', '取得不可');
  for (const element of root.querySelectorAll<HTMLElement>('.ls-hotkey-bar')) {
    const state = get('globalhotkeysenabled')?.toLowerCase();
    element.dataset.hotkeys = state === 'true' ? 'on' : state === 'false' ? 'off' : 'unknown';
  }
  set('phase', phases[phase ?? ''] ?? '—');
  set('game', get('getgamename') ?? 'ゲーム情報未取得');
  set('category', get('getcategoryname') ?? 'カテゴリ情報未取得');
  set('readout-note', phase ? 'LiveSplit.Bridge v4から同期しています。' : 'LiveSplit.Bridge v4への接続を待っています。');
  set('method', ({ RealTime: 'Real Time', GameTime: 'Game Time' })[get('gettimingmethod') ?? ''] ?? '—');
  set('comparison', get('getcomparisonname') ?? '—');
  set('attempts', get('getattemptcount') ?? '—');
  set('completed', get('getcompletedcount') ?? '—');
  set('current-split', summary.current);
  set('previous-split', summary.previous);
  set('split-note', summary.note);
  set('delta', displayTime(get('getdelta'), true));
  for (const element of root.querySelectorAll<HTMLElement>('[data-ls-field="delta"]')) element.dataset.sign = get('getdelta')?.startsWith('-') ? 'ahead' : get('getdelta') ? 'behind' : '';
  set('split-target', displayTime(get('getcomparisonsplittime')));
  set('last-split', displayTime(get('getlastsplittime')));
  set('best-possible', displayTime(get('getbestpossibletime')));
  set('final-time', displayTime(get('getfinaltime')));
  set('final-label', phase === 'Ended' ? '完走タイム' : '比較の最終タイム');
  set('split-progress', summary.progress);
  renderSplits(run, root);
}

