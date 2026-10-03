import type { RunReadout } from './readout.ts';
import { formatDelta } from './splits.ts';
import { columnsFor, columnValue, visibleSplits } from './columns.ts';
import type { Column } from './columns.ts';

function paint(cell: HTMLElement, run: RunReadout, index: number, column: Column, live: boolean) {
  const { value, delta } = columnValue(run, index, column, live);
  cell.textContent = value === null ? '—' : delta ? formatDelta(value) : formatDelta(value).replace(/^\+/, '');
  cell.dataset.sign = !delta || value === null ? '' : value < 0 ? 'ahead' : 'behind';
}
export function updateLiveSplits(run: RunReadout, root: ParentNode) {
  if (!(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  for (const cell of root.querySelectorAll<HTMLElement>('[data-live-column]')) {
    const column = columns[Number(cell.dataset.liveColumn)];
    if (column) paint(cell, run, run.history.index, column, root.getAttribute('live-delta') !== 'false');
  }
}
export function renderSplits(run: RunReadout, root: ParentNode) {
  const list = root.querySelector<HTMLElement>('[data-ls-field="splits"]');
  if (!list || !(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  const history = run.history;
  const length = Math.max(run.count, ...[...history.rows.keys()].map(i => i + 1), 0);
  const total = Math.max(1, Math.min(1000, Number(root.getAttribute('total-splits')) || length));
  const upcoming = Math.max(0, Math.min(total - 1, Number(root.getAttribute('upcoming-splits')) || 0));
  const indices = visibleSplits(length, history.index, total, upcoming, root.hasAttribute('always-show-last-split'));
  const signature = JSON.stringify([columns, indices, history.index, history.phase, length, [...run.names], [...history.rows],
    [...run.comparisons.rows].map(([i, values]) => [i, [...values]])]);
  if (list.dataset.signature === signature) { updateLiveSplits(run, root); return; }
  list.dataset.signature = signature;
  const head = root.querySelector('[data-ls-field="split-head"]');
  if (head) {
    const labels = ['区間', ...columns.map(c => c.name)];
    head.replaceChildren(...labels.map(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; return th; }));
  }
  const rows = indices.map(i => {
    const data = history.rows.get(i);
    const row = document.createElement('tr'); row.dataset.splitIndex = String(i);
    const active = i === history.index && ['Running', 'Paused'].includes(history.phase);
    row.className = active ? 'active' : '';
    if (active) row.setAttribute('aria-current', 'step');
    const name = document.createElement('th'); name.scope = 'row';
    const number = document.createElement('span'); number.className = 'split-number'; number.textContent = `${String(i + 1).padStart(2, '0')}  `;
    const label = document.createElement('span'); label.textContent = data?.name ?? run.names.get(i) ?? '未取得の区間';
    name.append(number, label); row.append(name);
    columns.forEach((column, columnIndex) => {
      const cell = document.createElement('td'); cell.dataset.comparison = column.comparison;
      cell.dataset.column = column.type === 'ComparisonTime' ? 'comparison-time' : column.type === 'LiveTime' ? 'time' : column.type.includes('Delta') ? 'delta' : 'time';
      cell.dataset.columnType = column.type;
      if (active) cell.dataset.liveColumn = String(columnIndex);
      paint(cell, run, i, column, root.getAttribute('live-delta') !== 'false'); row.append(cell);
    });
    return row;
  });
  if (!rows.length) {
    const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 1 + columns.length;
    cell.className = 'splits-empty'; cell.textContent = '計測開始後、取得した区間をここに表示します。'; row.append(cell); rows.push(row);
  }
  list.replaceChildren(...rows);
}
