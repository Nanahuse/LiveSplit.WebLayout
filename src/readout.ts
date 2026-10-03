import { formatTime } from './timer.ts';
import type { ReadCommand } from './timer.ts';
import { Comparisons } from './comparisons.ts';
import { renderSplits } from './split-view.ts';
import { SplitHistory, splitCommands } from './splits.ts';

const fastCommands: ReadCommand[] = [
  ...splitCommands, 'getdelta', 'getbestpossibletime', 'getfinaltime',
  'gettimingmethod', 'getcomparisonname',
];
const slowCommands: ReadCommand[] = ['getgamename', 'getcategoryname', 'getattemptcount', 'getcompletedcount', 'getsplitcount'];

export class RunReadout {
  readonly history = new SplitHistory();
  readonly comparisons = new Comparisons();
  private readingComparisons = false;
  liveTime = '—';
  readonly values = new Map<ReadCommand, string>();
  readonly names = new Map<number, string>();
  private queue: { command: ReadCommand; comparison: boolean }[] = [];
  private nextPoll = 0;
  private slowCursor = 0;
  private readonly refreshAt = new Map<ReadCommand, number>();
  private readonly retryAfter = new Map<ReadCommand, number>();
  readonly unavailable = new Set<ReadCommand>();

  nextCommand(): ReadCommand {
    if (!this.queue.length) {
      const now = Date.now();
      this.nextPoll = now + 100;
      this.queue = fastCommands
        .filter(command => splitCommands.includes(command) || (this.retryAfter.get(command) ?? 0) <= now)
        .map(command => ({ command, comparison: false }));
      this.queue.push(...this.comparisons.begin().map(command => ({ command, comparison: true })));
      // At most one low-priority read per cycle: long split lists never block
      // the next state snapshot. Each field has its own refresh deadline.
      const names = Array.from({ length: this.count }, (_, i): ReadCommand => `getsplitname ${(this.slowCursor + i) % this.count}`);
      const slow: ReadCommand[] = [...slowCommands, ...names];
      for (let i = 0; i < slow.length; i++) {
        const command = slow[i];
        if (Math.max(this.refreshAt.get(command) ?? 0, this.retryAfter.get(command) ?? 0) > now) continue;
        this.refreshAt.set(command, now + (command === 'getattemptcount' || command === 'getcompletedcount' ? 1000 : 5000));
        this.queue.push({ command, comparison: false });
        if (command.startsWith('getsplitname ')) this.slowCursor = Number(command.slice('getsplitname '.length)) + 1;
        break;
      }
    }
    const request = this.queue.shift()!;
    this.readingComparisons = request.comparison;
    return request.command;
  }

  nextDelay(): number { return this.queue.length ? 0 : Math.max(0, this.nextPoll - Date.now()); }

  receive(command: ReadCommand, value: string | null) {
    if (this.readingComparisons) { this.readingComparisons = false; this.comparisons.receive(value); return; }
    this.history.receive(command, value);
    const text = value?.trim();
    if (value === null) {
      this.retryAfter.set(command, Date.now() + 60000);
      this.unavailable.add(command);
    } else {
      this.retryAfter.delete(command);
      this.unavailable.delete(command);
    }
    if (command.startsWith('getsplitname ')) {
      const index = Number(command.slice('getsplitname '.length));
      if (text && text !== '-') this.names.set(index, text);
      else this.names.delete(index);
    } else {
      if (text && text !== '-') this.values.set(command, text);
      else this.values.delete(command);
      if (command === 'getsplitcount') {
        for (const index of this.names.keys()) if (index >= this.count) this.names.delete(index);
      }
    }
  }

  get count(): number {
    const count = Number(this.values.get('getsplitcount') ?? 0);
    return Number.isSafeInteger(count) && count >= 0 ? Math.min(count, 1000) : 0;
  }

  clear() { this.comparisons.clear(); this.readingComparisons = false; this.history.clear(); this.liveTime = '—'; this.values.clear(); this.names.clear(); this.retryAfter.clear(); this.unavailable.clear(); this.queue = []; this.nextPoll = this.slowCursor = 0; this.refreshAt.clear(); }
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
    current: waiting ? '開始待ち' : ended ? 'すべての区間が終了' : run.values.get('getcurrentsplitname') ?? '—',
    previous: waiting ? '—' : run.values.get('getprevioussplitname') ?? '—',
    progress: run.count ? `${ended ? run.count : Math.max(0, Math.min(index, run.count))} / ${run.count} 区間終了`
      : waiting ? '開始待ち' : ended ? '完走' : index >= 0 ? `第 ${index + 1} 区間` : '取得待ち',
    note: [
      waiting ? run.count > 0 ? '計測開始前の区間一覧です。開始すると現在区間とタイムが更新されます。' : 'LiveSplit で計測を開始すると現在区間が表示されます。' : '',
      run.unavailable.has('getsplitcount') ? '全区間一覧はこのサーバーから取得できません。接続中に取得した区間を順次表示します。' : '',
    ].filter(Boolean).join(' '),
  };
}

export function renderReadout(run: RunReadout, root: ParentNode) {
  const set = (id: string, text: string) => { for (const element of root.querySelectorAll(`[data-ls-field="${id}"]`)) element.textContent = text; };
  const get = (command: ReadCommand) => run.values.get(command);
  const phase = get('getcurrenttimerphase');
  const summary = splitSummary(run);
  const phases: Record<string, string> = { NotRunning: '待機中', Running: '計測中', Paused: '一時停止', Ended: '完走' };
  set('phase', phases[phase ?? ''] ?? '—');
  set('game', get('getgamename') ?? 'ゲーム情報未取得');
  set('category', get('getcategoryname') ?? 'カテゴリ情報未取得');
  set('readout-note', run.unavailable.size ? '一部の情報を取得できません。LiveSplit のバージョンとサーバーの対応コマンドを確認してください。' : '情報は LiveSplit から順次更新されます。');
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

