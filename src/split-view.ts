import type { RunReadout } from './readout.ts';
import { displayTime } from './readout.ts';
import { comparisonNames } from './comparisons.ts';
import { formatDelta, seconds } from './splits.ts';

function liveSeconds(time: string): number | null {
  const negative = time.startsWith('-');
  const parts = time.replace(/^-/, '').split(':').map(Number);
  return parts.length >= 2 && parts.every(Number.isFinite)
    ? parts.reduce((total, part) => total * 60 + part, 0) * (negative ? -1 : 1) : null;
}
function signed(cell: HTMLElement, delta: number | null) {
  cell.textContent = delta === null ? '—' : formatDelta(delta);
  cell.dataset.sign = delta === null ? '' : delta < 0 ? 'ahead' : 'behind';
}
export function updateLiveSplits(run: RunReadout, root: ParentNode) {
  const now = liveSeconds(run.liveTime);
  const index = run.history.index;
  const stable = Number(run.values.get('getsplitindex')) === index && run.values.get('getcurrenttimerphase') === run.history.phase;
  const enabled = !(root instanceof HTMLElement) || root.getAttribute('live-delta') !== 'false';
  for (const cell of root.querySelectorAll<HTMLElement>('[data-live-delta]')) {
    signed(cell, enabled && stable && now !== null ? run.comparisons.liveDelta(index, cell.dataset.comparison ?? '', now) : null);
  }
}
export function renderSplits(run: RunReadout, root: ParentNode) {
  const list = root.querySelector<HTMLElement>('[data-ls-field="splits"]');
  if (!list) return;
  const names = comparisonNames(root instanceof HTMLElement ? root.getAttribute('comparisons') : null);
  const history = run.history;
  const length = Math.max(run.count, ...[...history.rows.keys()].map(i => i + 1), 0);
  const signature = JSON.stringify([names, history.index, history.phase, length, [...run.names], [...history.rows],
    [...run.comparisons.rows].map(([i, values]) => [i, [...values]])]);
  if (list.dataset.signature === signature) { updateLiveSplits(run, root); return; }
  list.dataset.signature = signature;
  const head = root.querySelector('[data-ls-field="split-head"]');
  if (head) {
    const labels = ['区間', ...names.flatMap(name => [`${name || '現在の比較'} タイム`, `${name || '現在の比較'} 差分`]), '累積タイム'];
    head.replaceChildren(...labels.map(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; return th; }));
  }
  const rows = Array.from({ length }, (_, i) => {
    const data = history.rows.get(i);
    const row = document.createElement('tr');
    const active = i === history.index && ['Running', 'Paused'].includes(history.phase);
    row.className = active ? 'active' : '';
    if (active) row.setAttribute('aria-current', 'step');
    const name = document.createElement('th'); name.scope = 'row';
    const number = document.createElement('span'); number.className = 'split-number'; number.textContent = `${String(i + 1).padStart(2, '0')}  `;
    const label = document.createElement('span'); label.textContent = data?.name ?? run.names.get(i) ?? '未取得の区間';
    name.append(number, label); row.append(name);
    for (const comparison of names) {
      const target = run.comparisons.rows.get(i)?.get(comparison)?.target ?? null;
      const time = document.createElement('td'); time.dataset.comparison = comparison; time.dataset.column = 'comparison-time';
      time.textContent = target === null ? '—' : formatDelta(target).replace(/^\+/, '');
      const delta = document.createElement('td'); delta.dataset.comparison = comparison; delta.dataset.column = 'delta';
      const actual = data?.time ? seconds(data.time) : null;
      signed(delta, actual !== null && target !== null ? actual - target : null);
      if (active) delta.dataset.liveDelta = '';
      row.append(time, delta);
    }
    const time = document.createElement('td'); time.dataset.column = 'time';
    time.textContent = active ? run.liveTime : displayTime(data?.time);
    if (active) time.dataset.live = '';
    row.append(time); return row;
  });
  if (!rows.length) {
    const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 2 + names.length * 2;
    cell.className = 'splits-empty'; cell.textContent = '計測開始後、取得した区間をここに表示します。'; row.append(cell); rows.push(row);
  }
  list.replaceChildren(...rows); updateLiveSplits(run, root);
}
