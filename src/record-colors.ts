import type { RunReadout } from './readout.ts';
import { seconds } from './splits.ts';
import { liveSeconds } from './columns.ts';

export function recordStates(run: RunReadout) {
  const { index, phase } = run.history;
  const stable = run.values.get('getcurrenttimerphase') === phase && Number(run.values.get('getsplitindex')) === index
    && run.comparisons.phase === phase && run.comparisons.index === index;
  const best = new Set<number>();
  if (stable && phase !== 'NotRunning') {
    for (const [i, row] of run.history.rows) {
      if (i >= index) continue;
      const actual = row.time ? seconds(row.time) : null;
      const delta = actual === null ? null : run.comparisons.delta(i, 'Best Segments', actual, true);
      // This is one of the native CheckBestSegment conditions. Missing individual
      // BestSegmentTime is deliberately not treated as a first/new best.
      if (delta !== null && delta < 0) best.add(i);
    }
  }
  const current = liveSeconds(run.liveTime);
  let timer = 'unknown';
  if (stable && current !== null) {
    if (phase === 'NotRunning' || current < 0) timer = 'not-running';
    else if (phase === 'Paused') timer = 'paused';
    else if (phase === 'Ended') {
      const delta = run.comparisons.finalComparisonDelta;
      timer = delta === undefined ? 'unknown' : delta === null || delta < 0 ? 'pb' : 'behind-losing';
    } else if (phase === 'Running') {
      const comparison = run.comparisons.rows.get(index)?.get('');
      if (comparison) {
        const delta = comparison.target === null ? null : current - comparison.target;
        const previous = comparison.previousDelta;
        timer = delta === null || delta <= 0
          ? index > 0 && delta !== null && previous !== null && delta > previous ? 'ahead-losing' : 'ahead-gaining'
          : index > 0 && previous !== null && delta < previous ? 'behind-gaining' : 'behind-losing';
      }
    }
  }
  return { pb: timer === 'pb', timer, best, last: index - 1 };
}

export function validateRecordEffects(root: Element) {
  for (const attribute of ['pb-effect', 'bs-effect']) {
    const value = root.getAttribute(attribute);
    if (value !== null && !['color', 'rainbow', 'none'].includes(value)) throw new Error(`Invalid ${attribute}`);
  }
}
export function renderRecordColors(run: RunReadout, root: HTMLElement, connected: boolean) {
  if (!root.querySelector('.ls-timer, .ls-segment-time, [data-split-index], [data-ls-field="time"], [data-ls-field="segment-time"], [data-ls-field="previous-segment-time"]')) return;
  const state = recordStates(run);
  const apply = (element: HTMLElement, record: string) => {
    const effect = root.getAttribute(record === 'pb' ? 'pb-effect' : 'bs-effect') ?? 'color';
    element.dataset.record = connected ? record : '';
    element.dataset.recordEffect = connected && record ? effect : 'none';
  };
  for (const element of root.querySelectorAll<HTMLElement>('.ls-timer, [data-ls-field="time"]')) {
    element.dataset.timerColor = connected ? state.timer : 'unknown';
    apply(element, state.pb ? 'pb' : '');
  }
  for (const element of root.querySelectorAll<HTMLElement>('.ls-segment-time, [data-ls-field="segment-time"]')) {
    element.dataset.timerColor = connected ? state.timer : 'unknown';
    apply(element, state.pb ? 'pb' : '');
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-ls-field="previous-segment-time"]')) apply(element, state.best.has(state.last) ? 'bs' : '');
  for (const row of root.querySelectorAll<HTMLElement>('[data-split-index]')) {
    const index = Number(row.dataset.splitIndex);
    for (const cell of row.querySelectorAll<HTMLElement>('td')) apply(cell, state.best.has(index) ? 'bs' : '');
  }
}
