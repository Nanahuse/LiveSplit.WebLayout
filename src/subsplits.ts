import type { RunReadout } from './readout.ts';
import type { SplitSettings } from './split-settings.ts';
import { columnValue, liveSeconds } from './columns.ts';
import type { Column } from './columns.ts';
import { seconds } from './splits.ts';

export const subsplitDefaults = {
  MinimumMajorSplits: 0, IndentSubsplits: true, HideSubsplits: false, ShowSubsplits: false,
  CurrentSectionOnly: false, ShowHeader: true, IndentSectionSplit: true,
  HeaderComparison: 'Current Comparison', HeaderTimingMethod: 'Current Timing Method',
  HeaderText: true, HeaderTimes: true, HeaderAccuracy: 'Tenths', SectionTimer: true, SectionTimerAccuracy: 'Tenths',
};
export type SubsplitSettings = SplitSettings & typeof subsplitDefaults;
export interface Section { start: number; end: number }
export interface SubsplitRow { index: number; start: number; section: number; header?: boolean; collapsed?: boolean; indent?: boolean }
export function sectionsFor(names: string[]): Section[] {
  const result: Section[] = [];
  for (let end = names.length - 1; end >= 0;) {
    let start = end;
    while (start > 0 && names[start - 1].startsWith('-')) start--;
    result.unshift({ start, end }); end = start - 1;
  }
  return result;
}
export function subsplitName(name: string, index: number, count: number, collapsed = false, header = false) {
  if (name.startsWith('-') && index !== count - 1) return name.slice(1);
  const match = /^\{(.+)\}\s*(.+)$/.exec(name);
  return match ? match[collapsed || header ? 1 : 2] : name;
}
/** Mirrors the native row budget: header, preview, prior majors, then remaining rows. */
export function subsplitRows(names: string[], position: number, s: SubsplitSettings): (SubsplitRow | null)[] {
  if (!names.length) return [];
  const sections = sectionsFor(names);
  const sectionOf = (i: number) => sections.findIndex(g => g.start <= i && i <= g.end);
  const current = Math.min(Math.max(position, 0), names.length - 1), active = sectionOf(current);
  const major = (i: number) => sections[sectionOf(i)].end === i;
  const include = (i: number) => major(i) ? !s.CurrentSectionOnly || sectionOf(i) === active
    : s.ShowSubsplits || (!s.HideSubsplits && sectionOf(i) === active);
  const last = s.AlwaysShowLastSplit || current === names.length - 1;
  const header = s.ShowHeader && sections[active].start < sections[active].end && s.VisualSplitCount > (last ? 1 : 0);
  let free = s.VisualSplitCount - Number(last) - Number(header);
  let top = current - 1, bottom = current + 1;
  let reserve = !s.ShowSubsplits && !s.HideSubsplits ? Math.min(active, s.MinimumMajorSplits) : 0;
  const indices: (number | null)[] = [];
  if (current < names.length - 1 && free > 0 && (!s.HideSubsplits || major(current))) { indices.push(current); free--; }
  let previews = 0;
  while (previews < s.SplitPreviewCount && bottom < names.length - Number(last) && free > reserve) {
    if (include(bottom)) { indices.push(bottom); free--; previews++; } bottom++;
  }
  while (top >= 0 && free > 0) {
    if (include(top) && (free > reserve || major(top))) { indices.unshift(top); free--; if (major(top)) reserve--; } top--;
  }
  while (bottom < names.length - Number(last) && free > 0) {
    if (include(bottom)) { indices.push(bottom); free--; } bottom++;
  }
  if (!s.LockLastSplit && last) indices.push(names.length - 1);
  if (s.ShowBlankSplits) while (free-- > 0) indices.push(null);
  if (s.LockLastSplit && last) indices.push(names.length - 1);
  const rows: (SubsplitRow | null)[] = indices.map(i => {
    if (i === null) return null;
    const section = sectionOf(i), g = sections[section];
    const collapsed = !s.ShowSubsplits && (s.HideSubsplits || section !== active) && g.start < g.end;
    return { index: i, section, start: collapsed ? g.start : i, collapsed,
      indent: (s.IndentSubsplits && names[i].startsWith('-') && i !== names.length - 1)
        || (!s.ShowSubsplits && !s.HideSubsplits && s.IndentSectionSplit && section === active && g.start < g.end && i === g.end) };
  });
  if (header) {
    const at = active > 0 ? indices.indexOf(sections[active - 1].end) + 1 : 0;
    rows.splice(at, 0, { index: sections[active].end, start: sections[active].start, section: active, header: true } as SubsplitRow);
  }
  return rows.slice(0, s.VisualSplitCount);
}
export function methodRun(run: RunReadout, method?: string) {
  return !method || method === 'Current Timing Method' || method.replace(' ', '') === run.values.get('gettimingmethod')
    ? run : run.methods.get(method.replace(' ', ''));
}
function difference(a: number | null | undefined, b: number | null | undefined) { return a == null || b == null ? null : a - b; }
export function sectionTimes(run: RunReadout, group: Section, comparison: string) {
  const key = comparison === 'Current Comparison' || !run.comparisons.rows.get(group.end)?.has(comparison) ? '' : comparison;
  const target = (i: number) => run.comparisons.rows.get(i)?.get(key)?.target;
  const actual = (i: number) => { const t = run.history.rows.get(i)?.time; return t ? seconds(t) : null; };
  const time = !run.attemptFresh || group.start > run.history.index ? null
    : difference(group.end < run.history.index ? actual(group.end) : liveSeconds(run.liveTime), group.start > 0 ? actual(group.start - 1) : 0);
  const reference = difference(target(group.end), group.start > 0 ? target(group.start - 1) : 0);
  return { time, reference, delta: difference(time, reference), cumulative: difference(liveSeconds(run.liveTime), target(group.end)) };
}
export function subsplitValue(run: RunReadout, row: SubsplitRow, column: Column, live: boolean, best: boolean) {
  if (!row.collapsed) return columnValue(run, row.index, column, live, best);
  const model = methodRun(run, column.timingMethod);
  if (!model) return { value: null, delta: column.type.includes('Delta') };
  const base = columnValue(model, row.index, { ...column, timingMethod: 'Current Timing Method' }, false, best);
  const type = column.type;
  // Fixed reference columns and custom variables keep their explicitly defined semantics.
  if (['ComparisonTime', 'ComparisonSegmentTime', 'CustomVariable', 'SplitTime'].includes(type)) return base;
  const group = sectionTimes(model, { start: row.start, end: row.index }, column.comparison);
  const completed = row.index < model.history.index;
  const active = row.start <= model.history.index && model.history.index <= row.index && ['Running', 'Paused'].includes(model.history.phase);
  const segment = type.startsWith('Segment');
  const deltaType = type.includes('Delta');
  if (type === 'LiveTime') return { value: active ? liveSeconds(model.liveTime) : base.value, delta: false };
  if (deltaType) {
    const eligible = active && live && ((!segment && group.cumulative !== null && group.cumulative > 0) || (group.delta !== null && group.delta > 0));
    const delta = completed ? segment ? group.delta
      : columnValue(model, row.index, { ...column, type: 'Delta', timingMethod: 'Current Timing Method' }, false).value
      : eligible ? segment ? group.delta : group.cumulative : null;
    if (delta !== null || !type.includes('or')) return { value: delta, delta: true };
    if (!segment) return columnValue(model, row.index, { ...column, type: 'SplitTime', timingMethod: 'Current Timing Method' }, false);
  }
  return { value: completed ? group.time : group.reference, delta: false };
}
