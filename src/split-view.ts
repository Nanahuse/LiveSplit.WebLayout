import { html, nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { active } from './bridge-state.ts';
import type { ClockState } from './bridge-state.ts';
import { watchClock } from './clock-part.ts';
import type { RunReadout } from './readout.ts';
import type { Session } from './session.ts';
import { nativeSettings, splitSettings, splitNumber, subsplitSettings } from './split-settings.ts';
import { columnsFor, columnUsesClock, visibleSplits, methodRun } from './columns.ts';
import { subsplitRows, subsplitName, subsplitValue, sectionTimes } from './subsplits.ts';
import type { SubsplitRow } from './subsplits.ts';
import { comparisonColor } from './record-colors.ts';
import type { RecordEffect } from './record-colors.ts';

export function splitViewSettings(root: Element, bestEffect: RecordEffect) {
  const sub = root.localName === 'livesplit-subsplits';
  const raw = nativeSettings(root);
  const subsection = sub ? subsplitSettings(root, raw) : null;
  return {
    section: subsection,
    settings: subsection ?? splitSettings(root, raw),
    columns: columnsFor(raw.Columns),
    bestEffect,
    liveDelta: root.getAttribute('live-delta') !== 'false',
  };
}
type SplitViewSettings = ReturnType<typeof splitViewSettings>;

export function splitView(run: RunReadout, options: SplitViewSettings, session?: Session) {
  const { settings, section, columns, bestEffect, liveDelta } = options;
  const descriptors: (SubsplitRow | null)[] = section
    ? subsplitRows(Array.from({ length: run.count }, (_, i) => run.names.get(i) ?? ''), run.index, section)
    : visibleSplits(run.count, run.index, settings.VisualSplitCount, settings.SplitPreviewCount, settings.AlwaysShowLastSplit)
      .map(index => ({ index, start: index, section: 0 }));

  if (!section && settings.ShowBlankSplits && descriptors.length && descriptors.length < settings.VisualSplitCount) {
    const at = settings.LockLastSplit && settings.AlwaysShowLastSplit ? descriptors.length - 1 : descriptors.length;
    descriptors.splice(at, 0, ...Array<null>(settings.VisualSplitCount - descriptors.length).fill(null));
  }

  const last = settings.SeparatorLastSplit && settings.AlwaysShowLastSplit && descriptors.length > 1 ? descriptors.length - 1 : -1;
  const rowView = (row: SubsplitRow | null, position: number) => {
    const lastClass = position === last ? ' last-split' : '';
    if (!row) return html`<tr class=${'split-blank' + lastClass} aria-hidden="true"><td colspan=${columns.length + 1}>&nbsp;</td></tr>`;

    const i = row.index;
    const inRange = row.start <= run.index && run.index <= i;
    const isActive = active(run.phase) && inRange;
    const rawName = run.names.get(i) ?? '未取得の区間';
    const name = section ? subsplitName(rawName, i, run.count, row.collapsed, row.header) : rawName;
    if (row.header && section) {
      const model = methodRun(run, section.HeaderTimingMethod);
      const header = (clock?: ClockState) => {
        const times = sectionTimes(model, { start: row.start, end: i }, section.HeaderComparison, clock);
        const completed = i < run.index;
        const delta = times.delta !== null && (completed || times.delta >= 0) ? times.delta : null;
        const value = delta ?? (completed ? null : times.reference);
        return html`
          <span data-section-clock ?hidden=${!section.SectionTimer}>${times.time === null ? '—' : splitNumber(times.time, false, { ...settings, SplitTimesAccuracy: section.SectionTimerAccuracy })}</span>
          <span data-section-reference ?hidden=${!section.HeaderTimes} data-sign=${delta === null ? '' : delta < 0 ? 'ahead' : 'behind'}>${value === null ? '—' : splitNumber(value, delta !== null, { ...settings, SplitTimesAccuracy: section.HeaderAccuracy })}</span>`;
      };
      const times = isActive && (section.SectionTimer || section.HeaderTimes) && session ? watchClock(session, header) : header();
      return html`<tr class=${'subsplit-header' + lastClass} data-section-header data-section-start=${row.start} data-section-end=${i} data-section-index=${row.section}>
        <th scope="row"><span ?hidden=${!section.HeaderText}>${name}</span>${columns.length ? nothing : times}</th>
        ${columns.length ? html`<td colspan=${columns.length}>${times}</td>` : nothing}
      </tr>`;
    }

    const rowClass = (isActive ? 'active' : '') + (row.indent ? ' subsplit-indented' : '') + lastClass;
    return html`<tr class=${rowClass} data-split-index=${i} data-section-start=${row.start} data-section-end=${i} data-section-index=${row.section}
      data-collapsed=${!!row.collapsed} aria-current=${isActive ? 'step' : nothing}>
      <th scope="row"><span>${name}</span></th>
      ${columns.map((column, columnIndex) => {
        const model = methodRun(run, column.timingMethod);
        const cell = (clock?: ClockState) => subsplitValue(model, row, column, liveDelta, settings.ShowBestSegments, clock);
        const text = ({ value, delta, text }: ReturnType<typeof cell>) =>
          text ?? (value === null ? delta && i >= run.index ? '' : '—' : splitNumber(value, delta, settings));
        const fixed = cell();
        const completedDelta = i < run.index && fixed.delta && column.type.includes('Delta');
        const comparison = model.comparisons.rows.get(i);
        const previous = row.collapsed
          ? sectionTimes(model, { start: row.start, end: i }, column.comparison).delta
          : (comparison?.get(column.comparison) ?? comparison?.get(''))?.previousDelta;
        const color = completedDelta && fixed.value !== null
          ? comparisonColor(fixed.value, column.type.startsWith('Segment') ? null : previous) : nothing;
        const record = settings.ShowBestSegments && completedDelta && !row.collapsed && model.isBestSegment(i) ? 'bs' : '';
        const columnKind = column.type === 'ComparisonTime' ? 'comparison-time' : column.type.includes('Delta') ? 'delta' : 'time';
        return html`<td data-column=${columnKind} data-comparison=${column.comparison} data-column-index=${columnIndex} data-column-type=${column.type}
          data-sign=${completedDelta && fixed.value !== null ? fixed.value < 0 ? 'ahead' : 'behind' : ''}
          data-timer-color=${color} data-record=${record} data-record-effect=${record ? bestEffect : 'none'}
          style=${column.width ? styleMap({ '--ls-cell-width': column.width }) : nothing}>${isActive && session && columnUsesClock(column, liveDelta)
            ? watchClock(session, clock => text(cell(clock))) : text(fixed)}</td>`;
      })}
    </tr>`;
  };

  return html`<table class="ls-splits" aria-label=${section ? 'Subsplits' : 'Splits'}>
    <colgroup><col style="width: var(--ls-name-width, auto)">${columns.map(column => html`<col style=${styleMap({ width: column.width ?? 'var(--ls-column-width, auto)' })}>`)}</colgroup>
    <thead ?hidden=${!settings.ShowColumnLabels}><tr><th scope="col">区間</th>${columns.map(column => html`<th scope="col">${column.name}</th>`)}</tr></thead>
    <tbody>${descriptors.length
      ? repeat(descriptors, (row, position) => row ? row.header ? `header-${row.section}` : row.index : `blank-${position}`, rowView)
      : html`<tr><td class="splits-empty" colspan=${columns.length + 1}>${run.phase ? '区間が登録されていません。' : 'Bridgeから区間情報を取得しています。'}</td></tr>`}</tbody>
  </table>`;
}
