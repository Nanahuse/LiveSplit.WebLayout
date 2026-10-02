import { formatTime } from './timer.ts';
import type { ReadCommand } from './timer.ts';
import { SplitHistory, splitCommands, splitDelta } from './splits.ts';

const commands: ReadCommand[] = [
  ...splitCommands, 'getdelta', 'getbestpossibletime', 'getfinaltime',
  'getgamename', 'getcategoryname', 'gettimingmethod', 'getcomparisonname',
  'getattemptcount', 'getcompletedcount', 'getsplitcount',
];

export class RunReadout {
  readonly history = new SplitHistory();
  liveTime = '—';
  readonly values = new Map<ReadCommand, string>();
  readonly names = new Map<number, string>();
  private cursor = 0;
  private nameCursor = 0;
  private requestName = false;
  private readonly retryAfter = new Map<ReadCommand, number>();
  readonly unavailable = new Set<ReadCommand>();

  nextCommand(): ReadCommand {
    const count = this.count;
    if (this.requestName && count > 0) {
      this.requestName = false;
      const index = this.nameCursor++ % count;
      return `getsplitname ${index}`;
    }
    this.requestName = true;
    for (let i = 0; i < commands.length; i++) {
      const command = commands[this.cursor++ % commands.length];
      if (splitCommands.includes(command) || (this.retryAfter.get(command) ?? 0) <= Date.now()) return command;
    }
    return 'getcurrenttimerphase';
  }

  receive(command: ReadCommand, value: string | null) {
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

  clear() { this.history.clear(); this.liveTime = '—'; this.values.clear(); this.names.clear(); this.retryAfter.clear(); this.unavailable.clear(); this.cursor = this.nameCursor = 0; this.requestName = false; }
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
  const index = Number(get('getsplitindex') ?? -1);
  set('split-progress', summary.progress);
  const list = root.querySelector<HTMLElement>('[data-ls-field="splits"]');
  if (!list) return;
  const history = run.history;
  const length = Math.max(run.count, ...[...history.rows.keys()].map(i => i + 1), 0);
  const signature = JSON.stringify([history.index, history.phase, length, [...run.names], [...history.rows]]);
  if (list.dataset.signature === signature) return;
  list.dataset.signature = signature;
  const rows = Array.from({ length }, (_, i) => {
    const data = history.rows.get(i);
    const row = document.createElement('tr');
    const active = i === history.index && (history.phase === 'Running' || history.phase === 'Paused');
    row.className = active ? 'active' : '';
    if (active) row.setAttribute('aria-current', 'step');
    const name = document.createElement('th'); name.scope = 'row';
    const number = document.createElement('span'); number.className = 'split-number'; number.textContent = `${String(i + 1).padStart(2, '0')}  `;
    const label = document.createElement('span'); label.textContent = data?.name ?? run.names.get(i) ?? '未取得の区間';
    name.append(number, label);
    const delta = document.createElement('td'); const difference = data ? splitDelta(data) : undefined;
    delta.textContent = difference ?? '—'; delta.dataset.sign = difference?.startsWith('-') ? 'ahead' : difference ? 'behind' : '';
    const time = document.createElement('td');
    time.textContent = active ? run.liveTime : displayTime(data?.time);
    if (active) { time.dataset.live = ''; row.setAttribute('aria-label', '現在の区間'); }
    row.append(name, delta, time);
    return row;
  });
  if (!rows.length) {
    const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 3;
    cell.className = 'splits-empty'; cell.textContent = '計測開始後、取得した区間をここに表示します。'; row.append(cell); rows.push(row);
  }
  list.replaceChildren(...rows);
}
