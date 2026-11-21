import { active } from './bridge-state.ts';
import type { ClockState } from './bridge-state.ts';
import { clockTime, own, readout } from './readout.ts';
import type { RunReadout } from './readout.ts';

export const columnTypes = ['SplitTime', 'SegmentTime', 'Delta', 'SegmentDelta', 'DeltaorSplitTime', 'SegmentDeltaorSegmentTime', 'CustomVariable', 'ComparisonTime', 'ComparisonSegmentTime', 'LiveTime'] as const;
export type ColumnType = typeof columnTypes[number];
export interface Column { name: string; type: ColumnType; comparison: string; timingMethod?: string; width?: string }

function columnWidth(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return `${value}px`;
  if (typeof value === 'string' && /^(?:auto|(?:\d+(?:\.\d+)?|\.\d+)(?:px|em|rem|ch|%))$/.test(value)) return value;
  throw new Error('Column Width must be a nonnegative number (px), CSS length (px/em/rem/ch/%), or auto');
}

export function columnsFor(columns: unknown): Column[] {
  if (columns === undefined) return [{ name: '+/-', type: 'Delta', comparison: '' }, { name: 'Time', type: 'SplitTime', comparison: '' }];
  if (!Array.isArray(columns) || columns.length > 32) throw new Error('Columns must contain 0–32 columns');
  return columns.map((column: unknown) => {
    if (!column || typeof column !== 'object' || Array.isArray(column)) throw new Error('Invalid column');
    const raw = column as Record<string, unknown>;
    if (Object.keys(raw).some(key => !['Name', 'Type', 'Comparison', 'TimingMethod', 'Width'].includes(key))) throw new Error('Invalid column setting');
    const { Name, Type, Comparison, TimingMethod = 'Current Timing Method', Width } = raw;
    const type = typeof Type === 'string' ? Type.replaceAll(' ', '') as ColumnType : undefined;
    if (!type || !columnTypes.includes(type) || (Name !== undefined && typeof Name !== 'string')
      || (Comparison !== undefined && (typeof Comparison !== 'string' || /[\r\n\0]/.test(Comparison)))) throw new Error('Invalid column');
    if (typeof TimingMethod !== 'string' || !['Current Timing Method', 'Real Time', 'Game Time'].includes(TimingMethod)) throw new Error('Invalid TimingMethod');
    const comparison = Comparison === 'Current Comparison' || (Comparison === 'Best Split Times' && type.startsWith('Segment')) ? '' : Comparison ?? '';
    return { name: Name ?? type, type, comparison, timingMethod: TimingMethod, width: columnWidth(Width) };
  });
}

export function methodRun(run: RunReadout, method?: string) {
  if (method === 'Real Time') return readout(run.state, 'realTime');
  if (method === 'Game Time') return readout(run.state, 'gameTime');
  return run;
}

export function columnUsesClock(column: Column, liveDelta: boolean): boolean {
  return column.type === 'LiveTime' || (liveDelta && column.type.includes('Delta'));
}

export interface ColumnValue { value: number | null; delta: boolean; text?: string }
export function columnValue(run: RunReadout, index: number, column: Column, live: boolean, showBestSegments = true, clock?: ClockState): ColumnValue {
  const { type } = column;
  run = methodRun(run, column.timingMethod);
  if (type === 'CustomVariable') return { value: null, delta: false, text: index < run.index
    ? own(run.segmentVariables.get(index), column.name) ?? ''
    : index === run.index ? own(run.state.context?.variables, column.name) ?? '' : '' };
  const row = run.comparisons.rows.get(index);
  const comparison = row?.has(column.comparison) ? column.comparison : '';
  const snapshot = row?.get(comparison);
  const target = snapshot?.target ?? null;
  const actual = run.splitTimes.get(index) ?? null;
  const isActive = index === run.index && active(run.phase);
  const completed = index < run.index;
  const now = clockTime(run, clock);
  const segment = type.startsWith('Segment');
  const fallback = type.includes('or');
  if (type.includes('Delta')) {
    let value: number | null = null;
    if (completed && actual !== null) value = run.comparisons.delta(index, comparison, actual, segment);
    else if (isActive && live && now !== null) value = run.comparisons.liveDelta(index, comparison, now, segment, showBestSegments);
    if (value !== null || !fallback) return { value, delta: true };
  }
  if (type === 'ComparisonTime') return { value: target, delta: false };
  if (type === 'ComparisonSegmentTime') return {
    value: (comparison || run.comparison) === 'Best Segments' ? run.bestSegments.get(index) ?? null : snapshot?.segmentTarget ?? null,
    delta: false,
  };
  if (type === 'LiveTime') return { value: isActive ? now : actual, delta: false };
  if (!segment) return { value: completed ? actual : target, delta: false };
  const previous = snapshot?.previousTime;
  return { value: completed ? actual !== null && previous != null ? actual - previous : null : snapshot?.segmentTarget ?? null, delta: false };
}

export function visibleSplits(length: number, current: number, total: number, upcoming: number, last: boolean): number[] {
  const count = Math.min(length, Math.max(1, total));
  const start = Math.min(Math.max(0, current - (count - 2 - upcoming + (last ? 0 : 1))), length - count);
  return Array.from({ length: count }, (_, i) => last && i === count - 1 ? length - 1 : start + i);
}
