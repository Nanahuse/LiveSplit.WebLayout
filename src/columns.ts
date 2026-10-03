import { comparisonNames } from './comparisons.ts';
import type { RunReadout } from './readout.ts';
import { seconds } from './splits.ts';
import { nativeSettings } from './split-settings.ts';

export const columnTypes = ['SplitTime', 'SegmentTime', 'Delta', 'SegmentDelta', 'DeltaorSplitTime', 'SegmentDeltaorSegmentTime', 'ComparisonTime', 'LiveTime'] as const;
export type ColumnType = typeof columnTypes[number];
export interface Column { name: string; type: ColumnType; comparison: string; timingMethod?: string; width?: string }
function columnWidth(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return `${value}px`;
  if (typeof value === 'string' && /^(?:auto|(?:\d+(?:\.\d+)?|\.\d+)(?:px|em|rem|ch|%))$/.test(value)) return value;
  throw new Error('Column Width must be a nonnegative number (px), CSS length (px/em/rem/ch/%), or auto');
}
export function columnsFor(root: Element): Column[] {
  const settings = nativeSettings(root);
  const json = root.getAttribute('columns') ?? (settings.Columns === undefined ? null : JSON.stringify(settings.Columns));
  if (json !== null) {
    const columns: unknown = JSON.parse(json);
    if (!Array.isArray(columns) || columns.length > 32) throw new Error('columns must contain 0–32 columns');
    return columns.map((column: unknown) => {
      if (!column || typeof column !== 'object') throw new Error('Invalid column');
      const raw = column as Record<string, unknown>;
      const c = { name: raw.Name ?? raw.name, type: raw.Type ?? raw.type, comparison: raw.Comparison ?? raw.comparison, timingMethod: raw.TimingMethod ?? raw.timingMethod ?? 'Current Timing Method' } as Partial<Column>;
      if (typeof c.type === 'string') c.type = c.type.replaceAll(' ', '') as ColumnType;
      if (typeof c.type !== 'string' || !columnTypes.includes(c.type) || (c.name !== undefined && typeof c.name !== 'string') ||
        (c.comparison !== undefined && (typeof c.comparison !== 'string' || /[\r\n\0]/.test(c.comparison)))) throw new Error('Invalid column');
      if (!['Current Timing Method', 'Real Time', 'Game Time'].includes(c.timingMethod!)) throw new Error('Invalid Timing Method');
      if (['SegmentTime', 'SegmentDelta', 'SegmentDeltaorSegmentTime'].includes(c.type) && c.comparison === 'Best Split Times') c.comparison = '';
      const width = columnWidth(raw.Width ?? raw.width);
      return { name: c.name ?? c.type, type: c.type, comparison: !c.comparison || c.comparison === 'Current Comparison' ? '' : c.comparison, timingMethod: c.timingMethod, ...(width === undefined ? {} : { width }) };
    });
  }
  if (root.getAttribute('comparisons') === null) return [
    { name: '+/-', type: 'Delta', comparison: '' }, { name: 'Time', type: 'SplitTime', comparison: '' },
  ];
  return [...comparisonNames(root.getAttribute('comparisons')).flatMap<Column>(comparison => [
    { name: `${comparison || '現在の比較'} 累積タイム`, type: 'ComparisonTime', comparison },
    { name: `${comparison || '現在の比較'} ${comparison === 'Best Segments' ? '区間' : '累積'}差分`, type: comparison === 'Best Segments' ? 'SegmentDelta' : 'Delta', comparison },
  ]), { name: '累積タイム', type: 'LiveTime', comparison: '' }];
}

export function liveSeconds(time: string): number | null {
  const parts = time.replace(/^-/, '').split(':').map(Number);
  return parts.length >= 2 && parts.every(Number.isFinite)
    ? parts.reduce((total, part) => total * 60 + part, 0) * (time.startsWith('-') ? -1 : 1) : null;
}

export function columnValue(run: RunReadout, index: number, column: Column, live: boolean): { value: number | null; delta: boolean } {
  const { type, comparison } = column;
  const method = column.timingMethod;
  if (method && method !== 'Current Timing Method' && method.replace(' ', '') !== run.values.get('gettimingmethod')) return { value: null, delta: type.includes('Delta') };
  const snapshot = run.comparisons.rows.get(index)?.get(comparison);
  const target = snapshot?.target ?? null;
  const actualText = run.history.rows.get(index)?.time;
  const actual = actualText ? seconds(actualText) : null;
  const active = index === run.history.index && ['Running', 'Paused'].includes(run.history.phase);
  const completed = index < run.history.index;
  const now = liveSeconds(run.liveTime);
  const segment = type === 'SegmentTime' || type === 'SegmentDelta' || type === 'SegmentDeltaorSegmentTime';
  const isDelta = ['Delta', 'SegmentDelta', 'DeltaorSplitTime', 'SegmentDeltaorSegmentTime'].includes(type);
  const fallback = type === 'DeltaorSplitTime' || type === 'SegmentDeltaorSegmentTime';
  let value: number | null = null;
  if (isDelta) {
    if (completed && actual !== null) value = run.comparisons.delta(index, comparison, actual, segment);
    else if (active && live && now !== null && Number(run.values.get('getsplitindex')) === index && run.values.get('getcurrenttimerphase') === run.history.phase) {
      value = run.comparisons.liveDelta(index, comparison, now, segment);
    }
    if (value !== null || !fallback) return { value, delta: true };
  }
  if (type === 'ComparisonTime') return { value: target, delta: false };
  if (type === 'LiveTime') return { value: active ? now : actual, delta: false };
  if (!segment) return { value: completed ? actual : target, delta: false };
  const previous = snapshot?.previousTime;
  if (completed) value = actual !== null && previous != null ? actual - previous : null;
  else {
    // Adjacent comparison cumulative times define a comparison segment.
    const previousTarget = index === 0 ? 0 : run.comparisons.rows.get(index - 1)?.get(comparison)?.target
      ?? (previous != null && snapshot?.previousDelta != null ? previous - snapshot.previousDelta : null);
    value = target !== null && previousTarget != null ? target - previousTarget : null;
  }
  return { value, delta: false };
}

export function visibleSplits(length: number, current: number, total: number, upcoming: number, last: boolean): number[] {
  const count = Math.min(length, Math.max(1, total));
  const start = Math.min(Math.max(0, current - (count - 2 - upcoming + (last ? 0 : 1))), length - count);
  return Array.from({ length: count }, (_, i) => last && i === count - 1 ? length - 1 : start + i);
}
