import type { RunReadout } from './readout.ts';
import { splitSettings, splitNumber, subsplitSettings } from './split-settings.ts';
import type { SplitSettings } from './split-settings.ts';
import { columnsFor, columnValue, visibleSplits } from './columns.ts';
import type { Column } from './columns.ts';
import { subsplitRows, subsplitName, subsplitValue, sectionTimes, methodRun } from './subsplits.ts';
import type { SubsplitRow } from './subsplits.ts';

function paint(cell: HTMLElement, run: RunReadout, index: number, column: Column, live: boolean, settings: SplitSettings, descriptor?: SubsplitRow) {
  const { value, delta, text } = descriptor ? subsplitValue(run, descriptor, column, live, settings.ShowBestSegments)
    : columnValue(run, index, column, live, settings.ShowBestSegments);
  cell.textContent = text ?? (value === null ? (delta && index >= run.history.index ? '' : '—') : splitNumber(value, delta, settings));
  const unavailable = column.timingMethod && column.timingMethod !== 'Current Timing Method' && column.timingMethod.replace(' ', '') !== run.values.get('gettimingmethod') && !run.methods.has(column.timingMethod.replace(' ', ''));
  cell.title = unavailable ? 'この計測方法の比較値は未取得です' : '';
  cell.dataset.unavailable = unavailable ? 'timing-method' : '';
  cell.dataset.sign = !delta || value === null || index >= run.history.index ? '' : value < 0 ? 'ahead' : 'behind';
  if (descriptor?.collapsed) {
    delete cell.dataset.timerColor;
    const model = methodRun(run, column.timingMethod);
    if (model && index < model.history.index && column.type.includes('Delta')) {
      const times = sectionTimes(model, { start: descriptor.start, end: index }, column.comparison);
      if (delta && value !== null) cell.dataset.timerColor = value < 0
        ? !column.type.startsWith('Segment') && times.delta !== null && times.delta > 0 ? 'ahead-losing' : 'ahead-gaining'
        : !column.type.startsWith('Segment') && times.delta !== null && times.delta < 0 ? 'behind-gaining' : 'behind-losing';
    }
  }
}
function paintHeader(row: HTMLElement, run: RunReadout, root: Element) {
  const s = subsplitSettings(root), model = methodRun(run, s.HeaderTimingMethod);
  const end = Number(row.dataset.sectionEnd), start = Number(row.dataset.sectionStart);
  const times = model ? sectionTimes(model, { start, end }, s.HeaderComparison) : { time: null, reference: null, delta: null };
  const completed = end < run.history.index;
  const delta = times.delta !== null && (completed || times.delta >= 0) ? times.delta : null;
  const value = delta ?? (completed ? null : times.reference);
  const write = (selector: string, number: number | null, isDelta: boolean, accuracy: string, shown: boolean) => {
    const element = row.querySelector<HTMLElement>(selector); if (!element) return;
    element.hidden = !shown;
    element.textContent = number === null ? '—' : splitNumber(number, isDelta, { ...s, SplitTimesAccuracy: accuracy });
    element.dataset.sign = isDelta && number !== null ? number < 0 ? 'ahead' : 'behind' : '';
  };
  write('[data-section-clock]', times.time, false, s.SectionTimerAccuracy, s.SectionTimer);
  write('[data-section-reference]', value, delta !== null, s.HeaderAccuracy, s.HeaderTimes);
}
export function updateLiveSplits(run: RunReadout, root: ParentNode) {
  if (!(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  for (const cell of root.querySelectorAll<HTMLElement>('[data-live-column]')) {
    const column = columns[Number(cell.dataset.liveColumn)];
    const row = cell.closest<HTMLElement>('tr')!;
    const index = Number(row.dataset.splitIndex);
    const descriptor = row.dataset.collapsed === 'true' ? { index, start: Number(row.dataset.sectionStart), section: 0, collapsed: true } : undefined;
    if (column) paint(cell, run, index, column, root.getAttribute('live-delta') !== 'false', splitSettings(root), descriptor);
  }
  for (const row of root.querySelectorAll<HTMLElement>('[data-section-header]')) paintHeader(row, run, root);
}
export function renderSplits(run: RunReadout, root: ParentNode) {
  const list = root.querySelector<HTMLElement>('[data-ls-field="splits"]');
  if (!list || !(root instanceof HTMLElement)) return;
  const columns = columnsFor(root);
  const history = run.history;
  const length = run.count;
  const settings = splitSettings(root);
  const sub = root.localName === 'livesplit-subsplits';
  const descriptors: (SubsplitRow | null)[] = sub
    ? subsplitRows(Array.from({ length }, (_, i) => run.names.get(i) ?? ''), history.index, subsplitSettings(root))
    : visibleSplits(length, history.index, settings.VisualSplitCount, settings.SplitPreviewCount, settings.AlwaysShowLastSplit).map(index => ({ index, start: index, section: 0 }));
  root.dataset.twoRows = String(settings.Display2Rows);
  root.dataset.separators = String(settings.ShowThinSeparators);
  const signature = JSON.stringify([settings, sub ? subsplitSettings(root) : null, columns, descriptors, history.index, history.phase, length, [...run.names], [...history.rows],
    [...run.comparisons.rows].map(([i, values]) => [i, [...values]]), [...run.bestSegments], [...run.segmentVariables],
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
  const rows = descriptors.map(descriptor => {
    if (!descriptor) {
      const row = document.createElement('tr'); row.className = 'split-blank'; row.setAttribute('aria-hidden', 'true');
      const cell = document.createElement('td'); cell.colSpan = columns.length + 1; cell.textContent = '\u00a0'; row.append(cell); return row;
    }
    const i = descriptor.index;
    const data = history.rows.get(i);
    const row = document.createElement('tr');
    row.dataset.sectionStart = String(descriptor.start); row.dataset.sectionEnd = String(i);
    row.dataset.sectionIndex = String(descriptor.section); row.dataset.collapsed = String(!!descriptor.collapsed);
    if (!descriptor.header) row.dataset.splitIndex = String(i);
    const active = (descriptor.collapsed ? descriptor.start <= history.index && history.index <= i : i === history.index) && ['Running', 'Paused'].includes(history.phase);
    row.className = active ? 'active' : '';
    if (active) row.setAttribute('aria-current', 'step');
    const name = document.createElement('th'); name.scope = 'row';
    const number = document.createElement('span'); number.className = 'split-number'; number.textContent = `${String(i + 1).padStart(2, '0')}  `;
    const label = document.createElement('span');
    const rawName = data?.name ?? run.names.get(i) ?? '未取得の区間';
    label.textContent = sub ? subsplitName(rawName, i, length, descriptor.collapsed, descriptor.header) : rawName;
    if (descriptor.indent) row.classList.add('subsplit-indented');
    if (root.hasAttribute('comparisons')) name.append(number);
    name.append(label); row.append(name);
    if (descriptor.header) {
      row.dataset.sectionHeader = ''; row.className = 'subsplit-header';
      label.hidden = !subsplitSettings(root).HeaderText;
      const cell = document.createElement('td'); cell.colSpan = Math.max(1, columns.length);
      for (const field of ['sectionClock', 'sectionReference']) { const span = document.createElement('span'); span.dataset[field] = ''; cell.append(span); }
      if (!columns.length) { name.colSpan = 1; name.append(...cell.childNodes); } else row.append(cell);
      paintHeader(row, run, root); return row;
    }
    columns.forEach((column, columnIndex) => {
      const cell = document.createElement('td'); cell.dataset.comparison = column.comparison;
      cell.dataset.columnIndex = String(columnIndex);
      if (column.width) cell.style.setProperty('--ls-cell-width', column.width);
      cell.dataset.column = column.type === 'ComparisonTime' ? 'comparison-time' : column.type === 'LiveTime' ? 'time' : column.type.includes('Delta') ? 'delta' : 'time';
      cell.dataset.columnType = column.type;
      if (active) cell.dataset.liveColumn = String(columnIndex);
      paint(cell, run, i, column, root.getAttribute('live-delta') !== 'false', settings, descriptor); row.append(cell);
    });
    return row;
  });
  if (!sub && settings.ShowBlankSplits && rows.length && rows.length < settings.VisualSplitCount) {
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
