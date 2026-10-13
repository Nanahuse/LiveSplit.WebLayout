import type { RunReadout } from './readout.ts';
import { splitSettings, splitNumber } from './split-settings.ts';
import type { SplitSettings } from './split-settings.ts';
import { columnsFor, columnValue, visibleSplits } from './columns.ts';
import type { Column } from './columns.ts';

function paint(cell: HTMLElement, run: RunReadout, index: number, column: Column, live: boolean, settings: SplitSettings) {
  const { value, delta } = columnValue(run, index, column, live);
  cell.textContent = value === null ? (delta && index >= run.history.index ? '' : '—') : splitNumber(value, delta, settings);
  const unavailable = column.timingMethod && column.timingMethod !== 'Current Timing Method' && column.timingMethod.replace(' ', '') !== run.values.get('gettimingmethod') && !run.methods.has(column.timingMethod.replace(' ', ''));
  cell.title = unavailable ? 'この計測方法の比較値は未取得です' : '';
  cell.dataset.unavailable = unavailable ? 'timing-method' : '';
  cell.dataset.sign = !delta || value === null ? '' : value < 0 ? 'ahead' : 'behind';
}
export function updateLiveSplits(run: RunReadout, root: ParentNode) {
  if (!(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  for (const cell of root.querySelectorAll<HTMLElement>('[data-live-column]')) {
    const column = columns[Number(cell.dataset.liveColumn)];
    if (column) paint(cell, run, run.history.index, column, root.getAttribute('live-delta') !== 'false', splitSettings(root));
  }
}
export function renderSplits(run: RunReadout, root: ParentNode) {
  const list = root.querySelector<HTMLElement>('[data-ls-field="splits"]');
  if (!list || !(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  const history = run.history;
  const length = run.count;
  const settings = splitSettings(root);
  const indices = visibleSplits(length, history.index, settings.VisualSplitCount, settings.SplitPreviewCount, settings.AlwaysShowLastSplit);
  root.dataset.twoRows = String(settings.Display2Rows);
  root.dataset.separators = String(settings.ShowThinSeparators);
  const signature = JSON.stringify([settings, columns, indices, history.index, history.phase, length, [...run.names], [...history.rows],
    [...run.comparisons.rows].map(([i, values]) => [i, [...values]]), [...run.bestSegments],
    [...run.methods].map(([method, model]) => [method, [...model.history.rows], [...model.bestSegments],
      [...model.comparisons.rows].map(([i, values]) => [i, [...values]])])]);
  if (list.dataset.signature === signature) { updateLiveSplits(run, root); return; }
  list.dataset.signature = signature;
  const table = list.closest('table');
  if (table) {
    let group = table.querySelector('colgroup[data-ls-widths]');
    if (!group) { group = document.createElement('colgroup'); group.setAttribute('data-ls-widths', ''); table.insertBefore(group, table.querySelector('thead, tbody, tfoot')); }
    group.replaceChildren(...[undefined, ...columns].map((column, index) => {
      const col = document.createElement('col');
      col.style.width = index === 0 ? 'var(--ls-name-width, auto)' : column?.width ?? 'var(--ls-column-width, auto)';
      return col;
    }));
  }
  const head = root.querySelector('[data-ls-field="split-head"]');
  if (head) {
    (head as HTMLElement).hidden = !settings.ShowColumnLabels;
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
    if (root.hasAttribute('comparisons')) name.append(number);
    name.append(label); row.append(name);
    columns.forEach((column, columnIndex) => {
      const cell = document.createElement('td'); cell.dataset.comparison = column.comparison;
      cell.dataset.columnIndex = String(columnIndex);
      if (column.width) cell.style.setProperty('--ls-cell-width', column.width);
      cell.dataset.column = column.type === 'ComparisonTime' ? 'comparison-time' : column.type === 'LiveTime' ? 'time' : column.type.includes('Delta') ? 'delta' : 'time';
      cell.dataset.columnType = column.type;
      if (active) cell.dataset.liveColumn = String(columnIndex);
      paint(cell, run, i, column, root.getAttribute('live-delta') !== 'false', splitSettings(root)); row.append(cell);
    });
    return row;
  });
  if (settings.ShowBlankSplits && rows.length && rows.length < settings.VisualSplitCount) {
    const blanks = Array.from({ length: settings.VisualSplitCount - rows.length }, () => {
      const row = document.createElement('tr'); row.className = 'split-blank'; row.setAttribute('aria-hidden', 'true');
      const cell = document.createElement('td'); cell.colSpan = 1 + columns.length; cell.textContent = '\u00a0'; row.append(cell); return row;
    });
    rows.splice(settings.LockLastSplit && settings.AlwaysShowLastSplit ? rows.length - 1 : rows.length, 0, ...blanks);
  }
  if (settings.SeparatorLastSplit && settings.AlwaysShowLastSplit && rows.length > 1) rows.at(-1)!.classList.add('last-split');
  if (!rows.length) {
    const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 1 + columns.length;
    cell.className = 'splits-empty'; cell.textContent = history.phase ? '区間が登録されていません。' : 'Bridgeから区間情報を取得しています。'; row.append(cell); rows.push(row);
  }
  list.replaceChildren(...rows);
}
