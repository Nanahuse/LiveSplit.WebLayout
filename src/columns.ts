import { comparisonNames } from './comparisons.ts';
import type { RunReadout } from './readout.ts';
import { seconds } from './splits.ts';

export const columnTypes = ['SplitTime', 'SegmentTime', 'Delta', 'SegmentDelta', 'DeltaorSplitTime', 'SegmentDeltaorSegmentTime', 'ComparisonTime', 'LiveTime'] as const;
export type ColumnType = typeof columnTypes[number];
export interface Column { name: string; type: ColumnType; comparison: string }
export function columnsFor(root: Element): Column[] {
  const json = root.getAttribute('columns');
  if (json !== null) {
    const columns: unknown = JSON.parse(json);
    if (!Array.isArray(columns) || !columns.length || columns.length > 32) throw new Error('columns must contain 1–32 columns');
    return columns.map((column: unknown) => {
      if (!column || typeof column !== 'object') throw new Error('Invalid column');
      const c = column as Partial<Column>;
      if (typeof c.type !== 'string' || !columnTypes.includes(c.type) || (c.name !== undefined && typeof c.name !== 'string') ||
        (c.comparison !== undefined && (typeof c.comparison !== 'string' || /[\r\n\0]/.test(c.comparison)))) throw new Error('Invalid column');
      return { name: c.name ?? c.type, type: c.type, comparison: !c.comparison || c.comparison === 'Current Comparison' ? '' : c.comparison };
    });
  }
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
