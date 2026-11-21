import { active } from './bridge-state.ts';
import type { RunReadout } from './readout.ts';
import { nativeSettings, splitDefaults, splitNumber } from './split-settings.ts';

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
export type TimeSaveSettings = ReturnType<typeof timeSaveSettings>;

function comparisonKey(run: RunReadout, comparison: string) {
  return comparison !== 'Current Comparison' && run.comparisons.rows.get(0)?.has(comparison) ? comparison : '';
}

/** Native PossibleTimeSave combines individual bests over missing comparison splits. */
function timeSave(run: RunReadout, index: number, key: string, previousComponent: boolean) {
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
  return { start, value: target == null || best === null ? null : Math.max(0, target - baseline - best) };
}

export function possibleTimeSave(run: RunReadout, index: number, comparison: string): number | null {
  return timeSave(run, index, comparisonKey(run, comparison), false).value;
}

export function prepareTotalTimeSave(run: RunReadout, comparison: string): (now: number | null) => number | null {
  if (!run.phase || !run.attemptFresh) return () => null;
  if (run.phase === 'ended') return () => 0;
  const key = comparisonKey(run, comparison);
  let fixed = 0;
  const live: { index: number; value: number }[] = [];
  for (let i = Math.max(0, run.index); i < run.count; i++) {
    const { start, value } = timeSave(run, i, key, false);
    if (value === null) continue;
    if (start === run.index) live.push({ index: i, value });
    else fixed += value;
  }
  return now => live.reduce((total, { index, value }) => {
    const delta = now === null ? null : run.comparisons.delta(index, key, now, true);
    return total + (delta === null ? value : Math.max(0, Math.min(value, -delta)));
  }, fixed);
}

export function previousSegment(run: RunReadout, comparison: string, now: number | null) {
  const key = comparisonKey(run, comparison), { phase, index } = run;
  if (!run.attemptFresh || !phase || phase === 'not_running') return { delta: null, save: null, live: false, index: -1 };
  const liveDelta = now === null ? null : run.comparisons.liveDelta(index, key, now, true);
  const selected = liveDelta !== null ? index : index - 1;
  const actual = run.splitTimes.get(selected);
  const delta = liveDelta ?? (actual === undefined ? null : run.comparisons.delta(selected, key, actual, true));
  return { delta, save: selected < 0 ? null : timeSave(run, selected, key, true).value, live: liveDelta !== null, index: selected };
}

function format(value: number | null, accuracy: string, delta: boolean, drop: boolean) {
  if (value === null) return '—';
  const text = splitNumber(value, true, { ...splitDefaults, DeltasAccuracy: accuracy, DropDecimals: drop });
  return delta ? text : text.replace(/^\+/, '');
}

export function timeSaveDisplay(run: RunReadout, settings: TimeSaveSettings, previous: boolean) {
  const suffix = settings.Comparison === 'Current Comparison' ? '' : ` (${comparisonKey(run, settings.Comparison) || run.comparison || settings.Comparison})`;
  if (previous) return (now: number | null) => {
    const state = previousSegment(run, settings.Comparison, now);
    return {
      label: `${state.live ? 'Live Segment' : 'Previous Segment'}${suffix}`,
      value: format(state.delta, settings.DeltaAccuracy, true, settings.DropDecimals)
        + (settings.ShowPossibleTimeSave ? ` / ${format(state.save, settings.TimeSaveAccuracy, false, false)}` : ''),
      sign: state.delta === null ? '' : state.delta <= 0 ? 'ahead' : 'behind',
      record: !state.live && run.isBestSegment(state.index) ? 'bs' : '',
    };
  };

  const label = `${settings.TotalTimeSave ? 'Total ' : ''}Possible Time Save${suffix}`;
  const value = settings.TotalTimeSave ? prepareTotalTimeSave(run, settings.Comparison)
    : () => active(run.phase) ? possibleTimeSave(run, run.index, settings.Comparison) : null;
  return (now: number | null) => ({
    label, value: format(value(now), settings.Accuracy, false, settings.DropDecimals), sign: '', record: '',
  });
}
