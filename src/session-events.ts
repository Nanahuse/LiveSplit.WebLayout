import type { BridgeEvent } from './bridge-protocol.ts';
import { difference, phaseOf, splitIndexOf, timingMethods } from './bridge-state.ts';
import type { AttemptSegmentState, Phase, SessionState, Times, TimingMethod } from './bridge-state.ts';

export interface SplitResult extends AttemptSegmentState {
  readonly name: string;
  readonly deltas: Readonly<Record<string, Times>>;
}
type Operation = 'start' | 'split' | 'skip' | 'undo' | 'reset' | 'finish' | 'pause' | 'resume';
type RecordEvent = 'personal-best' | 'best-segment';
interface EventInfo {
  readonly sequence: number;
  readonly phase: Phase | null;
  readonly splitIndex: number;
  readonly result: SplitResult | null;
}
export type SessionEvent = {
  [Type in Operation]: Readonly<EventInfo & { type: Type }>
}[Operation] | {
  [Type in RecordEvent]: Readonly<EventInfo & { type: Type; result: SplitResult; timingMethods: readonly TimingMethod[] }>
}[RecordEvent];
export type SessionEventType = SessionEvent['type'];

function operation(event: BridgeEvent): Exclude<Operation, 'finish'> | undefined {
  switch (event.type) {
    case 'timer_started': return 'start';
    case 'timer_split': return 'split';
    case 'timer_skipped': return 'skip';
    case 'timer_undo': return 'undo';
    case 'timer_reset': return 'reset';
    case 'timer_phase_changed':
      if (event.timerState.phase === 'paused') return 'pause';
      if (event.timerState.phase === 'running') return 'resume';
  }
}

export function operationEvents(before: SessionState, after: SessionState, events: readonly BridgeEvent[]): SessionEvent[] {
  const results = new Map(after.attempt?.segments.map(segment => [segment.index, segment]));
  const segments = new Map(after.run?.segments.map(segment => [segment.index, segment]));
  const output: SessionEvent[] = [];
  // A later undo or split can overwrite the same row before the RPC reply. A
  // reset, start, or run change can replace the entire attempt.
  const lastBoundary = events.reduce((last, event, i) => ['timer_reset', 'timer_started', 'run_changed'].includes(event.type) ? i : last, -1);
  const lastWrites = new Map<number, number>();
  events.forEach((event, i) => {
    if (!event.timerState) return;
    const index = splitIndexOf(event.timerState);
    if (event.type === 'timer_split' || event.type === 'timer_skipped') lastWrites.set(index - 1, i);
    if (event.type === 'timer_undo') lastWrites.set(index, i);
  });

  events.forEach((event, i) => {
    const type = operation(event);
    if (!type) return;
    const timer = event.timerState;
    const phase = timer ? phaseOf(timer) : 'not_running';
    const splitIndex = timer ? splitIndexOf(timer) : -1;
    const index = splitIndex - 1;
    const definition = segments.get(index);
    const actual = results.get(index);
    const confirmed = type === 'split' && i > lastBoundary && lastWrites.get(index) === i
      && index < after.splitIndex && definition && actual && timingMethods.some(method => actual.splitTime[method] !== null);
    const result: SplitResult | null = confirmed ? Object.freeze({
      ...actual,
      name: definition.name,
      deltas: Object.freeze(Object.fromEntries(Object.entries(definition.comparisons).map(([name, target]) => [
        name, Object.freeze(Object.fromEntries(timingMethods.map(method => {
          const time = actual.splitTime[method], reference = target[method];
          return [method, time === null || reference === null ? null : difference(time, reference)];
        })) as Record<TimingMethod, number | null>),
      ]))),
    }) : null;
    const info = { sequence: event.eventSequence, phase, splitIndex, result };
    output.push(Object.freeze({ type, ...info }));
    if (type !== 'split') return;
    if (phase === 'ended') output.push(Object.freeze({ type: 'finish', ...info }));
    // A changed run can have a new PB or best baseline. Require the same run
    // snapshot and consecutive split times before attributing a record.
    if (!result || !definition || before.run !== after.run) return;
    const previous = results.get(index - 1);
    const best = timingMethods.filter(method => {
      const time = result.splitTime[method];
      const start = index === 0 ? 0 : previous?.splitTime[method];
      const reference = definition.bestSegment[method];
      return time !== null && start != null && (reference === null || difference(time, start) < reference);
    });
    const pb = phase === 'ended' ? timingMethods.filter(method => {
      const time = result.splitTime[method], reference = definition.comparisons['Personal Best']?.[method];
      return time !== null && reference !== undefined && (reference === null || time < reference);
    }) : [];
    if (pb.length) output.push(Object.freeze({ ...info, type: 'personal-best', result, timingMethods: Object.freeze(pb) }));
    if (best.length) output.push(Object.freeze({ ...info, type: 'best-segment', result, timingMethods: Object.freeze(best) }));
  });
  return output;
}
