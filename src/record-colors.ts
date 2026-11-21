import type { RunReadout } from './readout.ts';

export function comparisonColor(delta: number, previous?: number | null) {
  return delta <= 0
    ? previous != null && delta > previous ? 'ahead-losing' : 'ahead-gaining'
    : previous != null && delta < previous ? 'behind-gaining' : 'behind-losing';
}

export function timerColor(run: RunReadout, now: number | null) {
  if (now === null) return 'unknown';
  if (run.phase === 'not_running' || now < 0) return 'not-running';
  if (run.phase === 'paused') return 'paused';
  if (run.phase === 'ended') return !run.attemptFresh || run.finalTime === null ? 'unknown' : run.personalBest ? 'pb' : 'behind-losing';
  if (run.phase !== 'running') return 'unknown';
  const comparison = run.comparisons.rows.get(run.index)?.get('');
  if (!comparison) return 'unknown';
  return comparisonColor(comparison.target === null ? 0 : now - comparison.target,
    comparison.target === null || run.index === 0 ? null : comparison.previousDelta);
}

export type RecordEffect = 'color' | 'rainbow' | 'none';
export function recordEffect(root: Element, name: 'pb-effect' | 'bs-effect'): RecordEffect {
  const value = root.getAttribute(name) ?? 'color';
  if (value !== 'color' && value !== 'rainbow' && value !== 'none') throw new Error(`Invalid ${name}`);
  return value;
}
