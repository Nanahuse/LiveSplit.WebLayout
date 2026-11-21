import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSnapshot } from './readout-fixture.ts';
import { segmentMetrics } from '../src/readout.ts';
import { columnValue } from '../src/columns.ts';
import { TimerPhase, TimingMethod } from '../src/generated/protocol.ts';
import { fixture, ticks, attemptSegment } from './bridge-fixture.ts';

test('fixed comparison segment columns retain references before and after completion', () => {
  const s = fixture(); let { model, clock } = readSnapshot(s);
  const best = { name: 'Best', type: 'ComparisonSegmentTime' as const, comparison: 'Best Segments' };
  const pb = { ...best, comparison: 'Personal Best' };
  for (const phase of [TimerPhase.NOT_RUNNING, TimerPhase.RUNNING, TimerPhase.PAUSED, TimerPhase.ENDED]) {
    s.timer.phase = phase; s.timer.splitIndex = phase === TimerPhase.NOT_RUNNING ? -1 : phase === TimerPhase.ENDED ? 3 : 1;
    ({ model, clock } = readSnapshot(s));
    assert.deepEqual(columnValue(model, 0, best, true), { value: 50, delta: false });
    assert.equal(columnValue(model, 0, pb, true).value, 60);
    assert.equal(columnValue(model, 0, { ...best, timingMethod: 'Game Time' }, true).value, 45);
  }
  // Missing actuals (skips) do not erase reference values; missing bests stay unknown.
  assert.equal(columnValue(model, 1, best, true).value, 50);
  s.run.segments[1].bestSegmentTime = {}; ({ model, clock } = readSnapshot(s));
  assert.equal(columnValue(model, 1, best, true).value, null);
});

test('full snapshots populate future comparisons, restore attempt results and support independent methods', () => {
  const s = fixture(); const { model, clock } = readSnapshot(s);
  assert.equal(model.state.run?.gameName, 'Game');
  assert.equal(model.state.context?.variables.Deaths, '<b>42</b>');
  assert.equal(model.names.get(2), 'Third');
  assert.equal(columnValue(model, 2, { name: 'PB', type: 'SplitTime', comparison: '' }, true).value, 180);
  assert.equal(columnValue(model, 2, { name: 'PB', type: 'SegmentTime', comparison: '' }, true).value, 60);
  assert.equal(columnValue(model, 2, { name: 'GT', type: 'SplitTime', comparison: '', timingMethod: 'Game Time' }, true).value, 170);
  assert.equal(model.splitTimes.get(0), 59);
  assert.equal(segmentMetrics(model, clock[model.timingMethod]).segment, 24.45);
  assert.equal(model.sumOfBest, 150);
});
test('skip, undo, reset and run changes replace state without preserving obsolete rows', () => {
  const s = fixture(); let { model, clock } = readSnapshot(s);
  s.timer.splitIndex = 2; ({ model, clock } = readSnapshot(s));
  assert.ok(Math.abs(segmentMetrics(model, clock[model.timingMethod]).segment! - 24.45) < .001);
  s.attempt.segments.push(attemptSegment(1, ticks(80)));
  ({ model, clock } = readSnapshot(s)); assert.ok(Math.abs(segmentMetrics(model, clock[model.timingMethod]).segment! - 3.45) < .001);
  s.timer.splitIndex = 1; ({ model, clock } = readSnapshot(s)); assert.equal(model.splitTimes.get(1), undefined);
  s.timer.phase = TimerPhase.NOT_RUNNING; ({ model, clock } = readSnapshot(s));
  assert.equal(model.index, -1); assert.equal(model.splitTimes.get(0), undefined);
  s.run.segments.splice(1); ({ model, clock } = readSnapshot(s)); assert.equal(model.count, 1); assert.equal(model.names.has(2), false);
});
test('ended PB and sum of best can be restored without an earlier connection', () => {
  const s = fixture(); let { model, clock } = readSnapshot(s); s.timer.phase = TimerPhase.ENDED; s.timer.splitIndex = 3; s.timer.realTimeTicks = ticks(170);
  s.attempt.segments.push(attemptSegment(2, ticks(170)));
  ({ model, clock } = readSnapshot(s)); assert.equal(model.personalBest, true); assert.equal(model.sumOfBest, 150);
  s.context.currentTimingMethod = TimingMethod.GAME_TIME; s.timer.isGameTimeInitialized = false;
  ({ model, clock } = readSnapshot(s)); assert.equal(clock.gameTime, null); assert.equal(model.personalBest, false);
  assert.equal(model.finalTime, null); assert.equal(model.pace, null);
});
test('timer event cannot assign old attempt results to a new split', () => {
  const s = fixture(); let { model, clock } = readSnapshot(s); s.timer.splitIndex = 2; s.attemptFresh = false;
  ({ model, clock } = readSnapshot(s)); assert.equal(model.index, 2);
  assert.equal(segmentMetrics(model, clock[model.timingMethod]).segment, null);
});
