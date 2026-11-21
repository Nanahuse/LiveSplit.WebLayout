import { active, difference } from './bridge-state.ts';
import type { ClockState, Phase, SegmentState, SessionState, TimingMethod } from './bridge-state.ts';
import { Comparisons } from './comparisons.ts';
import type { Comparison } from './comparisons.ts';
import { clockParts } from './timer.ts';

export class RunReadout {
  readonly comparisons: Comparisons;
  readonly bestSegments = new Map<number, number | null>();
  readonly segments: readonly SegmentState[];
  readonly names = new Map<number, string>();
  readonly splitTimes = new Map<number, number>();
  readonly segmentVariables = new Map<number, Readonly<Record<string, string>>>();
  readonly index: number;
  readonly phase: Phase | null;
  readonly comparison: string;
  readonly attemptFresh: boolean;
  readonly lastSplit: number | null;
  readonly delta: number | null;
  readonly finalTarget: number | null;
  readonly sumOfBest: number | null;
  readonly personalBest: boolean;
  private readonly remainingBest: number | null;
  private readonly currentBaseline: number | null;

  constructor(readonly state: SessionState, readonly timingMethod: TimingMethod) {
    this.segments = state.run?.segments ?? [];
    this.index = state.splitIndex;
    this.phase = state.phase;
    this.comparison = state.context?.comparison ?? '';
    this.attemptFresh = state.attemptFresh;
    this.comparisons = new Comparisons(this.index, this.phase, this.bestSegments);

    const results = new Map(state.attempt?.segments.map(segment => [segment.index, segment]));
    const previousTargets = new Map<string, number>();
    const previousDeltas = new Map<string, number>();
    const comparisons = new Set(['', ...(state.run?.comparisons ?? [])]);
    let previousActual: number | null = null;
    let remaining: number | null = 0;
    for (const segment of this.segments) {
      const i = segment.index, best = segment.bestSegment[timingMethod];
      const result = i < this.index ? results.get(i) : undefined;
      const actual = result?.splitTime[timingMethod];
      this.names.set(i, segment.name);
      this.bestSegments.set(i, best);
      if (result) this.segmentVariables.set(i, result.variables);
      if (i >= this.referenceIndex) remaining = remaining === null || best === null ? null : remaining + best;

      const row = new Map<string, Comparison>();
      for (const name of comparisons) {
        const target = own(segment.comparisons, name || this.comparison)?.[timingMethod] ?? null;
        row.set(name, {
          target,
          previousDelta: this.attemptFresh ? previousDeltas.get(name) ?? 0 : null,
          previousTime: this.attemptFresh ? previousActual ?? 0 : null,
          segmentTarget: target === null ? null : target - (previousTargets.get(name) ?? 0),
        });
        // Missing comparison targets and actual splits are skipped independently.
        if (target !== null) {
          previousTargets.set(name, target);
          if (actual != null) previousDeltas.set(name, actual - target);
        }
      }
      this.comparisons.rows.set(i, row);
      if (actual != null) {
        this.splitTimes.set(i, actual);
        previousActual = actual;
      }
    }
    const last = this.segments.at(-1)?.index ?? -1;
    this.lastSplit = previousActual;
    this.delta = state.delta[timingMethod];
    this.finalTarget = this.comparisons.rows.get(last)?.get('')?.target ?? null;
    this.sumOfBest = this.comparisons.rows.get(last)?.get('Best Segments')?.target ?? null;
    this.remainingBest = remaining;
    this.currentBaseline = this.index < 0 ? 0 : this.comparisons.rows.get(this.index)?.get('')?.previousTime ?? null;
    const finalTime = this.splitTimes.get(last);
    const pb = own(this.segments.at(-1)?.comparisons, 'Personal Best')?.[timingMethod];
    this.personalBest = this.phase === 'ended' && finalTime !== undefined && pb !== undefined && (pb === null || finalTime < pb);
  }

  get count() { return this.segments.length; }
  get referenceIndex() { return this.phase === 'ended' ? this.index - 1 : Math.max(0, this.index); }
  get finalTime() { return this.phase === 'ended' ? this.splitTimes.get(this.referenceIndex) ?? null : this.finalTarget; }
  get pace() { return this.phase === 'ended' ? this.finalTime : this.finalTarget === null ? null : this.finalTarget + (this.delta ?? 0); }

  bestPossibleTime(now: number | null): number | null {
    if (this.phase === 'ended') return this.finalTime;
    const best = this.bestSegments.get(this.index);
    if (!this.attemptFresh || now === null || this.currentBaseline === null || this.remainingBest === null || !this.count) return null;
    return this.currentBaseline + this.remainingBest + (best == null ? 0 : Math.max(0, now - this.currentBaseline - best));
  }

  isBestSegment(index: number): boolean {
    if (!this.attemptFresh || index >= this.index) return false;
    const time = this.splitTimes.get(index);
    const start = index === 0 ? 0 : this.splitTimes.get(index - 1);
    const best = this.bestSegments.get(index);
    return time !== undefined && start !== undefined && best !== undefined
      && (best === null || difference(time, start) < best);
  }
}

const readouts = new WeakMap<SessionState, Partial<Record<TimingMethod, RunReadout>>>();
export function readout(state: SessionState, timingMethod = state.context?.timingMethod ?? 'realTime') {
  let methods = readouts.get(state);
  if (!methods) { methods = {}; readouts.set(state, methods); }
  return methods[timingMethod] ??= new RunReadout(state, timingMethod);
}

export function own<T>(values: Readonly<Record<string, T>> | undefined, key: string): T | undefined {
  return values && Object.hasOwn(values, key) ? values[key] : undefined;
}

export function displayClock(value: number | null) {
  return clockParts(value, '1:23', '.23');
}

export function displayTime(value: number | null | undefined, delta = false) {
  if (value == null || !Number.isFinite(value)) return '—';
  const { whole, fraction } = displayClock(value);
  return `${delta && value >= 0 ? '+' : ''}${whole}${fraction}`;
}

export function clockTime(run: RunReadout, clock: ClockState | undefined): number | null {
  return clock && clock.phase === run.phase && clock.splitIndex === run.index ? clock[run.timingMethod] : null;
}

export function splitSummary(run: RunReadout) {
  const waiting = run.phase === 'not_running', ended = run.phase === 'ended';
  return {
    current: waiting ? run.names.get(0) ?? '開始待ち' : ended ? 'すべての区間が終了' : run.names.get(run.index) ?? '—',
    previous: run.names.get(run.index - 1) ?? '—',
    progress: run.count ? `${ended ? run.count : Math.max(0, Math.min(run.index, run.count))} / ${run.count} 区間終了` : '取得待ち',
  };
}

export function segmentMetrics(run: RunReadout, now: number | null) {
  if (!run.attemptFresh) return { segment: null, previous: null, delta: null };
  const { index, phase } = run;
  const endIndex = phase === 'ended' ? index - 1 : index;
  const current = phase === 'ended' ? run.splitTimes.get(endIndex) : now;
  const previous = run.splitTimes.get(index - 1);
  const baseline = run.comparisons.rows.get(endIndex)?.get('')?.previousTime;
  const previousBaseline = run.comparisons.rows.get(index - 1)?.get('')?.previousTime;
  return {
    segment: (active(phase) || phase === 'ended') && current != null && baseline != null ? difference(current, baseline) : null,
    previous: previous != null && previousBaseline != null ? difference(previous, previousBaseline) : null,
    delta: active(phase) && current != null ? run.comparisons.liveDelta(index, '', current, true) : null,
  };
}
