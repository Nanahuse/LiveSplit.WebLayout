import type { BridgeSnapshot } from './bridge-client.ts';
import { TimerPhase } from './generated/protocol.ts';
import type { TimeValue } from './generated/protocol.ts';
import type { ConnectionStatus } from './timer.ts';

export type TimingMethod = 'realTime' | 'gameTime';
export type Phase = 'not_running' | 'running' | 'paused' | 'ended';
export const timingMethods = ['realTime', 'gameTime'] as const;

/** Elapsed seconds for each timing method. Null denotes an unavailable time. */
export type Times = Readonly<Record<TimingMethod, number | null>>;
export interface ClockState extends Times {
  readonly phase: Phase | null;
  readonly splitIndex: number;
  readonly timingMethod: TimingMethod;
  readonly gameTimePaused: boolean;
}
type Variables = Readonly<Record<string, string>>;
export interface SegmentState {
  readonly index: number;
  readonly name: string;
  readonly bestSegment: Times;
  readonly comparisons: Readonly<Record<string, Times>>;
}
export interface AttemptSegmentState {
  readonly index: number;
  readonly splitTime: Times;
  readonly variables: Variables;
}
export interface SessionState {
  readonly endpoint: string;
  readonly status: ConnectionStatus;
  readonly message: string;
  readonly phase: Phase | null;
  readonly splitIndex: number;
  readonly run: Readonly<{
    gameName: string;
    categoryName: string;
    offset: number;
    comparisons: readonly string[];
    segments: readonly SegmentState[];
  }> | null;
  readonly context: Readonly<{
    timingMethod: TimingMethod;
    comparison: string;
    variables: Variables;
  }> | null;
  readonly attempt: Readonly<{
    count: number;
    segments: readonly AttemptSegmentState[];
  }> | null;
  readonly completedCount: number | null;
  readonly attemptFresh: boolean;
  readonly delta: Times;
}

export const seconds = (ticks: bigint | undefined): number | null => ticks === undefined ? null : Number(ticks) / 10_000_000;
export const difference = (a: number, b: number): number => Math.round((a - b) * 10_000_000) / 10_000_000;
const times = (value: TimeValue): Times => Object.freeze({ realTime: seconds(value.realTimeTicks), gameTime: seconds(value.gameTimeTicks) });
const noTime = times({});
const variables = (value: Variables) => Object.freeze({ ...value });
export const phaseOf = (timer: BridgeSnapshot['timer']): Phase | null => timer.phase === 'unspecified' ? null : timer.phase;
export const splitIndexOf = (timer: BridgeSnapshot['timer']): number => timer.phase === TimerPhase.NOT_RUNNING ? -1 : timer.splitIndex;
export const active = (phase: Phase | null) => phase === 'running' || phase === 'paused';

export function emptyState(endpoint: string, status: ConnectionStatus = 'connecting', message = ''): SessionState {
  return Object.freeze({
    endpoint, status, message, phase: null, splitIndex: -1, run: null, context: null, attempt: null,
    completedCount: null, attemptFresh: false, delta: noTime,
  });
}

export function bridgeState(endpoint: string, snapshot: BridgeSnapshot, previous?: { snapshot: BridgeSnapshot; state: SessionState }): SessionState {
  const { timer, run, context, attempt, completed, attemptFresh } = snapshot;
  const phase = phaseOf(timer), splitIndex = splitIndexOf(timer);
  const old = previous?.state;
  const oldSnapshot = previous?.snapshot;
  if (old && oldSnapshot && old.phase === phase && old.splitIndex === splitIndex && old.attemptFresh === attemptFresh
    && oldSnapshot.run === run && oldSnapshot.context === context && oldSnapshot.attempt === attempt
    && old.completedCount === completed.completedCount) return old;

  const runState = old && oldSnapshot?.run === run ? old.run : Object.freeze({
    gameName: run.gameName,
    categoryName: run.categoryName,
    offset: Number(run.offsetTicks) / 10_000_000,
    comparisons: Object.freeze([...new Set([...run.comparisons, ...run.segments.flatMap(segment => segment.comparisons.map(c => c.name))])]),
    segments: Object.freeze([...run.segments].sort((a, b) => a.index - b.index).map(segment => Object.freeze({
      index: segment.index, name: segment.name, bestSegment: times(segment.bestSegmentTime),
      comparisons: Object.freeze(Object.fromEntries(segment.comparisons.map(c => [c.name, times(c.time)]))),
    }))),
  });
  const contextState = old && oldSnapshot?.context === context ? old.context : Object.freeze({
    timingMethod: context.currentTimingMethod === 'game_time' ? 'gameTime' : 'realTime',
    comparison: context.currentComparison,
    variables: variables(context.customVariables),
  });
  let attemptState: SessionState['attempt'] = null;
  if (attemptFresh) {
    attemptState = old?.attempt && oldSnapshot?.attempt === attempt ? old.attempt : Object.freeze({
      count: attempt.attemptCount,
      segments: Object.freeze(attempt.segments.map(segment => Object.freeze({
        index: segment.index, splitTime: times(segment.splitTime), variables: variables(segment.customVariables),
      }))),
    });
  }
  return Object.freeze({
    endpoint, status: 'connected', message: '', phase, splitIndex, attemptFresh, completedCount: completed.completedCount,
    run: runState, context: contextState, attempt: attemptState,
    delta: latestDelta(runState, context.currentComparison, attemptState, splitIndex),
  });
}

function latestDelta(run: SessionState['run'], comparison: string, attempt: SessionState['attempt'], splitIndex: number): Times {
  if (!run || !attempt || splitIndex <= 0) return noTime;
  const delta = (method: TimingMethod) => {
    let latest: AttemptSegmentState | undefined;
    for (const segment of attempt.segments) {
      if (segment.index < splitIndex && segment.splitTime[method] !== null && (!latest || segment.index > latest.index)) latest = segment;
    }
    if (!latest) return null;
    const index = latest.index;
    const references = run.segments.find(segment => segment.index === index)?.comparisons;
    const target = references && Object.hasOwn(references, comparison) ? references[comparison][method] : null;
    const actual = latest.splitTime[method];
    return target === null || actual === null ? null : difference(actual, target);
  };
  return Object.freeze({ realTime: delta('realTime'), gameTime: delta('gameTime') });
}

export function bridgeClock(state: SessionState, snapshot: BridgeSnapshot | undefined, now: number): ClockState {
  const timer = snapshot?.timer;
  const phase = timer ? phaseOf(timer) : null;
  const elapsed = snapshot && phase === 'running'
    ? BigInt(Math.floor(Math.min(Math.max(0, now - snapshot.timerAt), 2000) * 10_000))
    : 0n;
  const gameTicks = timer?.isGameTimeInitialized ? timer.gameTimeTicks : undefined;
  return Object.freeze({
    phase, splitIndex: timer ? splitIndexOf(timer) : -1, timingMethod: state.context?.timingMethod ?? 'realTime',
    realTime: seconds(timer ? timer.realTimeTicks + elapsed : undefined),
    gameTime: seconds(gameTicks === undefined ? undefined : gameTicks + (timer?.isGameTimePaused ? 0n : elapsed)),
    gameTimePaused: timer?.isGameTimePaused ?? false,
  });
}
