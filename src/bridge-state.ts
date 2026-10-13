import type { BridgeSnapshot } from './bridge-client.ts';
import { clockTicks } from './bridge-client.ts';
import { TimingMethod, TimerPhase } from './generated/livesplit/bridge/v3/common_pb.ts';
import type { TimeValue } from './generated/livesplit/bridge/v3/common_pb.ts';
import { RunReadout } from './readout.ts';
import { formatTime } from './timer.ts';
import type { ReadField } from './timer.ts';

export function timeSpan(ticks: bigint): string {
  const sign = ticks < 0n ? '-' : ''; const v = ticks < 0n ? -ticks : ticks;
  const seconds = v / 10000000n;
  return `${sign}${String(seconds / 3600n).padStart(2, '0')}:${String(seconds / 60n % 60n).padStart(2, '0')}:${String(seconds % 60n).padStart(2, '0')}.${String(v % 10000000n).padStart(7, '0')}`;
}
const numeric = (ticks: bigint | undefined) => ticks === undefined ? null : Number(ticks) / 10000000;
const valueFor = (time: TimeValue | undefined, game: boolean) => game ? time?.gameTimeTicks : time?.realTimeTicks;
const phaseNames: Record<number, string> = { [TimerPhase.NOT_RUNNING]: 'NotRunning', [TimerPhase.RUNNING]: 'Running', [TimerPhase.PAUSED]: 'Paused', [TimerPhase.ENDED]: 'Ended' };
function setTime(run: RunReadout, key: ReadField, value: number | null) {
  if (value === null || !Number.isFinite(value)) run.values.delete(key);
  else run.values.set(key, timeSpan(BigInt(Math.round(value * 10000000))));
}

function fill(run: RunReadout, snapshot: BridgeSnapshot, game: boolean) {
  run.clear(); run.attemptFresh = snapshot.attemptFresh;
  const { timer, context } = snapshot;
  const phase = phaseNames[timer.phase] ?? '';
  const index = timer.phase === TimerPhase.NOT_RUNNING ? -1 : timer.splitIndex;
  run.history.phase = run.comparisons.phase = phase; run.history.index = run.comparisons.index = index;
  const method = game ? 'GameTime' : 'RealTime';
  const set = (key: ReadField, value: string | number) => run.values.set(key, String(value));
  set('getcurrenttimerphase', phase); set('getsplitindex', index); set('getsplitcount', snapshot.run.segments.length);
  set('getgamename', snapshot.run.gameName); set('getcategoryname', snapshot.run.categoryName);
  set('gettimingmethod', method); set('getcomparisonname', context.currentComparison);
  set('getattemptcount', snapshot.attempt.attemptCount); set('getcompletedcount', snapshot.completed.completedCount);
  for (const [name, value] of Object.entries(context.customVariables)) set(`getcustomvariablevalue ${name}`, value);
  const results = new Map(snapshot.attempt.segments.map(segment => [segment.index, segment]));
  const segments = [...snapshot.run.segments].sort((a, b) => a.index - b.index);
  const names = [...new Set([...snapshot.run.comparisons, ...segments.flatMap(segment => segment.comparisons.map(c => c.name))])];
  let previousActual: number | null = 0;
  let previousActualIndex = -1;
  const previousTargets = new Map<string, number>();
  const previousDeltas = new Map<string, number>();
  for (const segment of segments) {
    const i = segment.index;
    const result = snapshot.attemptFresh && i < index ? valueFor(results.get(i)?.splitTime, game) : undefined;
    run.names.set(i, segment.name);
    if (snapshot.attemptFresh && i < index) run.segmentVariables.set(i, { ...results.get(i)?.customVariables });
    run.history.rows.set(i, { index: i, name: segment.name, time: result === undefined ? undefined : timeSpan(result) });
    run.bestSegments.set(i, numeric(valueFor(segment.bestSegmentTime, game)));
    run.comparisons.bestSegments.set(i, run.bestSegments.get(i)!);
    const comparisons = new Map<string, { target: number | null; previousDelta: number | null; previousTime: number | null; segmentTarget?: number | null }>();
    for (const name of ['', ...names]) {
      const actualName = name || context.currentComparison;
      const target = numeric(valueFor(segment.comparisons.find(c => c.name === actualName)?.time, game));
      comparisons.set(name, {
        target, previousDelta: snapshot.attemptFresh ? previousDeltas.get(name) ?? 0 : null,
        previousTime: snapshot.attemptFresh ? previousActual : null,
        segmentTarget: target === null ? null : target - (previousTargets.get(name) ?? 0),
      });
      // Native helpers skip missing comparisons, independently of missing actuals.
      if (target !== null) {
        previousTargets.set(name, target);
        if (result !== undefined) previousDeltas.set(name, numeric(result)! - target);
      }
    }
    run.comparisons.rows.set(i, comparisons);
    if (result !== undefined) { previousActual = numeric(result); previousActualIndex = i; }
  }
  set('getcurrentsplitname', run.names.get(run.referenceIndex) ?? ''); set('getprevioussplitname', run.names.get(index - 1) ?? '');
  const last = segments.at(-1)?.index ?? -1;
  const final = run.comparisons.rows.get(last)?.get('')?.target ?? null;
  const currentTarget = run.comparisons.rows.get(run.referenceIndex)?.get('')?.target ?? null;
  setTime(run, 'getcomparisonsplittime', currentTarget);
  setTime(run, 'getlastsplittime', index > 0 && snapshot.attemptFresh ? previousActual : null);
  const previousComparison = run.comparisons.rows.get(previousActualIndex)?.get('')?.target;
  const delta = previousActualIndex < 0 ? null : previousActual !== null && previousComparison != null ? previousActual - previousComparison : null;
  setTime(run, 'getdelta', snapshot.attemptFresh ? delta : null);
  run.comparisons.finalComparisonDelta = phase === 'Ended' && snapshot.attemptFresh
    ? final === null ? null : delta ?? undefined : undefined;
  setTime(run, 'getfinaltime', phase === 'Ended' ? previousActual : final);
  setTime(run, 'getpredictedtime', phase === 'Ended' ? previousActual : final !== null ? final + (delta ?? 0) : null);
  // No attempt history is exposed; use the generated Best Segments comparison.
  run.comparisons.sumOfBest = run.comparisons.rows.get(last)?.get('Best Segments')?.target ?? null;
}

export function applyBridgeSnapshot(run: RunReadout, snapshot: BridgeSnapshot, now: number) {
  const game = snapshot.context.currentTimingMethod === TimingMethod.GAME_TIME;
  fill(run, snapshot, game);
  const other = new RunReadout(); fill(other, snapshot, !game);
  run.methods.set(game ? 'RealTime' : 'GameTime', other);
  updateBridgeClock(run, snapshot, now);
}
export function updateBridgeClock(run: RunReadout, snapshot: BridgeSnapshot, now: number) {
  for (const model of [run, ...run.methods.values()]) {
    const game = model.values.get('gettimingmethod') === 'GameTime';
    const ticks = clockTicks(snapshot, now, game);
    const formatted = ticks === undefined ? null : formatTime(timeSpan(ticks));
    model.liveTime = formatted ? `${formatted.whole}${formatted.fraction}` : '—';
    for (const [key, isGame] of [['getcurrentrealtime', false], ['getcurrentgametime', true]] as const) {
      const raw = clockTicks(snapshot, now, isGame);
      if (raw === undefined) model.values.delete(key); else model.values.set(key, timeSpan(raw));
    }
    let possible: number | null = null;
    const current = numeric(ticks);
    const { phase, index } = model.history;
    if (phase === 'Ended') possible = current;
    else if (snapshot.attemptFresh && current !== null) {
      const start = Math.max(0, index);
      const baseline = index < 0 ? 0 : model.comparisons.rows.get(index)?.get('')?.previousTime;
      if (baseline != null) {
        let total = baseline;
        let known = true;
        for (let i = start; i < model.count; i++) {
          const best = model.bestSegments.get(i);
          if (best == null) { known = false; break; }
          total += i === start && index >= 0 ? Math.max(best, current - baseline) : best;
        }
        if (known) possible = total;
      }
    }
    setTime(model, 'getbestpossibletime', possible);
  }
}
