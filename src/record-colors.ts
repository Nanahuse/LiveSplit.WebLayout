import type { RunReadout } from './readout.ts';
import { seconds } from './splits.ts';

const events = new WeakMap<RunReadout, { index: number; at: number; best: boolean }>();
export function recordStates(run: RunReadout, now = Date.now()) {
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
  if (phase === 'NotRunning' || index < 0) events.delete(run);
  else if (stable) {
    const old = events.get(run);
    if (!old || old.index !== index || old.best !== best.has(index - 1)) {
      events.set(run, { index, at: now, best: best.has(index - 1) });
    }
  }
  const last = index - 1;
  const actualText = run.history.rows.get(last)?.time;
  const actual = actualText ? seconds(actualText) : null;
  const target = run.comparisons.rows.get(last)?.get('Personal Best')?.target;
  const pb = stable && phase === 'Ended' && actual !== null && target != null && actual < target;
  const event = events.get(run);
  return { pb, best, last, flash: stable && event?.index === index && event.best && now - event.at < 2000 };
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
    apply(element, state.pb ? 'pb' : state.flash ? 'bs' : '');
  }
  for (const element of root.querySelectorAll<HTMLElement>('.ls-segment-time, [data-ls-field="segment-time"]')) {
    apply(element, (run.history.phase === 'Ended' ? state.best.has(state.last) : state.flash) ? 'bs' : '');
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-ls-field="previous-segment-time"]')) apply(element, state.best.has(state.last) ? 'bs' : '');
  for (const row of root.querySelectorAll<HTMLElement>('[data-split-index]')) {
    const index = Number(row.dataset.splitIndex);
    for (const cell of row.querySelectorAll<HTMLElement>('td')) apply(cell, state.best.has(index) ? 'bs' : '');
  }
}
