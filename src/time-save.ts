import type { RunReadout } from './readout.ts';
import { nativeSettings, splitDefaults, splitNumber } from './split-settings.ts';
import { liveSeconds } from './columns.ts';
import { seconds } from './splits.ts';
import { recordStates } from './record-colors.ts';

const defaults = { Comparison: 'Current Comparison', Display2Rows: false, TotalTimeSave: false,
  Accuracy: 'Hundredths', DropDecimals: false, DeltaAccuracy: 'Tenths', TimeSaveAccuracy: 'Tenths', ShowPossibleTimeSave: false };
export function timeSaveSettings(root: Element) {
  const previous = root.localName === 'livesplit-previous-segment';
  const allowed = previous
    ? ['Comparison', 'Display2Rows', 'DeltaAccuracy', 'DropDecimals', 'TimeSaveAccuracy', 'ShowPossibleTimeSave']
    : ['Comparison', 'Display2Rows', 'TotalTimeSave', 'Accuracy', 'DropDecimals'];
  const raw = nativeSettings(root);
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.includes(key)) throw new Error(`未対応の表示設定: ${key}（装飾はCSSで指定）`);
    if (typeof value !== typeof defaults[key as keyof typeof defaults]) throw new Error(`Invalid ${key}`);
  }
  const settings = { ...defaults, DropDecimals: previous, ...raw };
  for (const key of ['Accuracy', 'DeltaAccuracy', 'TimeSaveAccuracy'] as const)
    if (!['Seconds', 'Tenths', 'Hundredths', 'Milliseconds'].includes(settings[key])) throw new Error(`Invalid ${key}`);
  if (/[\r\n\0]/.test(settings.Comparison)) throw new Error('Invalid Comparison');
  return settings;
}
function comparisonKey(run: RunReadout, comparison: string) {
  return comparison !== 'Current Comparison' && run.comparisons.rows.get(0)?.has(comparison) ? comparison : '';
}

/** Native PossibleTimeSave: combine individual bests over missing comparison splits. */
export function possibleTimeSave(run: RunReadout, index: number, comparison: string, live = false, previousComponent = false): number | null {
  const key = comparisonKey(run, comparison);
  let start = index, baseline = 0, best = run.bestSegments.get(index) ?? null;
  while (start > 0 && best !== null) {
    const prior = run.comparisons.rows.get(start - 1)?.get(key)?.target;
    if (prior != null) { baseline = prior; break; }
    start--;
    const part = run.bestSegments.get(start);
    best = part == null ? null : best + part;
  }
  // PreviousSegment's upstream helper uses the rewound index for its target.
  const target = run.comparisons.rows.get(previousComponent ? start : index)?.get(key)?.target;
  if (target == null || best === null) return null;
  let value = target - baseline - best;
  if (live && start === run.history.index) {
    if (!run.attemptFresh) return null;
    const now = liveSeconds(run.liveTime);
    const delta = now === null ? null : run.comparisons.delta(index, key, now, true);
    if (delta !== null) value = Math.min(value, -delta);
  }
  return Math.max(0, value);
}
export function totalPossibleTimeSave(run: RunReadout, comparison: string): number | null {
  if (!run.history.phase) return null;
  if (run.history.phase === 'Ended') return 0;
  if (!run.attemptFresh) return null;
  let total = 0;
  for (let i = Math.max(0, run.history.index); i < run.count; i++) total += possibleTimeSave(run, i, comparison, true) ?? 0;
  return total;
}
export function previousSegment(run: RunReadout, comparison: string) {
  const key = comparisonKey(run, comparison), { phase, index } = run.history;
  if (!run.attemptFresh || !phase || phase === 'NotRunning') return { delta: null, save: null, live: false, index: -1 };
  const now = liveSeconds(run.liveTime);
  const liveDelta = now === null ? null : run.comparisons.liveDelta(index, key, now, true);
  const selected = liveDelta !== null ? index : index - 1;
  const actual = run.history.rows.get(selected)?.time;
  const delta = liveDelta ?? (actual ? run.comparisons.delta(selected, key, seconds(actual)!, true) : null);
  return { delta, save: selected < 0 ? null : possibleTimeSave(run, selected, key, false, true), live: liveDelta !== null, index: selected };
}
function format(value: number | null, accuracy: string, delta: boolean, drop: boolean) {
  if (value === null) return '—';
  // Both native formatters use single-digit seconds; Possible Time Save has no plus.
  const text = splitNumber(value, true, { ...splitDefaults, DeltasAccuracy: accuracy, DropDecimals: drop });
  return delta ? text : text.replace(/^\+/, '');
}
export function renderTimeSave(run: RunReadout, root: HTMLElement, connected: boolean) {
  const previous = root.localName === 'livesplit-previous-segment';
  const possible = root.localName === 'livesplit-possible-time-save';
  if (!previous && !possible) return;
  const settings = timeSaveSettings(root);
  root.dataset.twoRows = String(settings.Display2Rows);
  root.dataset.nativeMetric = '';
  const suffix = settings.Comparison === 'Current Comparison' ? '' : ` (${comparisonKey(run, settings.Comparison) || run.values.get('getcomparisonname') || settings.Comparison})`;
  let label: string, text: string;
  const state = previousSegment(run, settings.Comparison);
  if (previous) {
    label = `${state.live ? 'Live Segment' : 'Previous Segment'}${suffix}`;
    text = format(state.delta, settings.DeltaAccuracy, true, settings.DropDecimals)
      + (settings.ShowPossibleTimeSave ? ` / ${format(state.save, settings.TimeSaveAccuracy, false, false)}` : '');
  } else {
    label = `${settings.TotalTimeSave ? 'Total ' : ''}Possible Time Save${suffix}`;
    const value = settings.TotalTimeSave ? totalPossibleTimeSave(run, settings.Comparison)
      : ['Running', 'Paused'].includes(run.history.phase) ? possibleTimeSave(run, run.history.index, settings.Comparison) : null;
    text = format(value, settings.Accuracy, false, settings.DropDecimals);
  }
  for (const element of root.querySelectorAll<HTMLElement>('.ls-label')) {
    element.textContent = root.getAttribute('label') ?? label; element.hidden = root.hasAttribute('hide-label');
  }
  for (const element of root.querySelectorAll<HTMLElement>(previous ? '[data-ls-field="previous-segment-delta"]' : '[data-ls-field="possible-time-save"]')) {
    element.textContent = text;
    element.dataset.sign = connected && previous && state.delta !== null ? state.delta <= 0 ? 'ahead' : 'behind' : '';
    const best = connected && previous && !state.live && recordStates(run).best.has(state.index);
    element.dataset.record = best ? 'bs' : '';
    element.dataset.recordEffect = best ? root.getAttribute('bs-effect') ?? 'color' : 'none';
  }
}
