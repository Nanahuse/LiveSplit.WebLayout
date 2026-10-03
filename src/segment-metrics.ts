import type { RunReadout } from './readout.ts';
import { displayTime } from './readout.ts';
import { liveSeconds } from './columns.ts';
import { formatDelta, seconds } from './splits.ts';

function previousTime(run: RunReadout, index: number): number | null {
  if (index === 0) return 0;
  const row = run.comparisons.rows.get(index);
  const snapshot = row?.values().next().value;
  if (snapshot?.previousTime != null) return snapshot.previousTime;
  // Only walk over explicitly observed skipped rows. Missing history is unknown.
  for (let i = index - 1; i >= 0; i--) {
    const previous = run.history.rows.get(i);
    if (!previous) return null;
    if (previous.time) return seconds(previous.time);
  }
  return 0;
}
export function segmentMetrics(run: RunReadout) {
  const { index, phase } = run.history;
  const stable = Number(run.values.get('getsplitindex') ?? -1) === index && run.values.get('getcurrenttimerphase') === phase;
  const active = stable && ['Running', 'Paused'].includes(phase);
  const endIndex = phase === 'Ended' ? index - 1 : index;
  const currentText = run.history.rows.get(endIndex)?.time;
  const current = phase === 'Ended' ? currentText ? seconds(currentText) : null : liveSeconds(run.liveTime);
  const baseline = previousTime(run, endIndex);
  const previousText = run.history.rows.get(index - 1)?.time;
  const previous = previousText ? seconds(previousText) : null;
  const previousBaseline = previousTime(run, index - 1);
  return {
    segment: stable && (active || phase === 'Ended') && current !== null && baseline !== null ? current - baseline : null,
    previous: stable && index > 0 && previous !== null && previousBaseline !== null ? previous - previousBaseline : null,
    delta: active && current !== null ? run.comparisons.liveDelta(index, '', current, true) : null,
  };
}
export function renderSegmentMetrics(run: RunReadout, root: ParentNode) {
  const values = segmentMetrics(run);
  const format = (value: number | null, delta = false) => value === null ? '—' : delta ? formatDelta(value) : formatDelta(value).replace(/^\+/, '');
  const fields: Record<string, string> = {
    'segment-time': format(values.segment), 'previous-segment-time': format(values.previous),
    'live-segment-delta': format(values.delta, true), 'sum-of-best': format(run.comparisons.sumOfBest),
    'current-pace': displayTime(run.values.get('getpredictedtime')),
    'real-time': displayTime(run.values.get('getcurrentrealtime')),
    'game-time': displayTime(run.values.get('getcurrentgametime')),
  };
  for (const [field, value] of Object.entries(fields)) {
    for (const element of root.querySelectorAll<HTMLElement>(`[data-ls-field="${field}"]`)) {
      element.textContent = value;
      if (field === 'live-segment-delta') element.dataset.sign = values.delta === null ? '' : values.delta < 0 ? 'ahead' : 'behind';
    }
  }
}
