import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBridgeSnapshot, timeSpan } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';
import { columnValue } from '../src/columns.ts';
import { recordStates } from '../src/record-colors.ts';
import { segmentMetrics } from '../src/segment-metrics.ts';
import { TimerPhase, TimingMethod } from '../src/generated/protocol.ts';
import { fixture, ticks, attemptSegment } from './bridge-fixture.ts';

test('fixed comparison segment columns retain references before and after completion', () => {
  const s = fixture(), model = new RunReadout();
  const best = { name: 'Best', type: 'ComparisonSegmentTime' as const, comparison: 'Best Segments' };
  const pb = { ...best, comparison: 'Personal Best' };
  for (const phase of [TimerPhase.NOT_RUNNING, TimerPhase.RUNNING, TimerPhase.PAUSED, TimerPhase.ENDED]) {
    s.timer.phase = phase; s.timer.splitIndex = phase === TimerPhase.NOT_RUNNING ? -1 : phase === TimerPhase.ENDED ? 3 : 1;
    applyBridgeSnapshot(model, s, 0);
    assert.deepEqual(columnValue(model, 0, best, true), { value: 50, delta: false });
    assert.equal(columnValue(model, 0, pb, true).value, 60);
    assert.equal(columnValue(model, 0, { ...best, timingMethod: 'Game Time' }, true).value, 45);
  }
  // Missing actuals (skips) do not erase reference values; missing bests stay unknown.
  assert.equal(columnValue(model, 1, best, true).value, 50);
  s.run.segments[1].bestSegmentTime = {}; applyBridgeSnapshot(model, s, 0);
  assert.equal(columnValue(model, 1, best, true).value, null);
});

test('full snapshots populate future comparisons, restore attempt results and support independent methods', () => {
  const model = new RunReadout(), s = fixture(); applyBridgeSnapshot(model, s, 0);
  assert.equal(model.values.get('getgamename'), 'Game');
  assert.equal(model.values.get('getcustomvariablevalue Deaths'), '<b>42</b>');
  assert.equal(model.names.get(2), 'Third');
  assert.equal(columnValue(model, 2, { name: 'PB', type: 'SplitTime', comparison: '' }, true).value, 180);
  assert.equal(columnValue(model, 2, { name: 'PB', type: 'SegmentTime', comparison: '' }, true).value, 60);
  assert.equal(columnValue(model, 2, { name: 'GT', type: 'SplitTime', comparison: '', timingMethod: 'Game Time' }, true).value, 170);
  assert.equal(model.history.rows.get(0)?.time, timeSpan(ticks(59)));
  assert.equal(segmentMetrics(model).segment, 24.450000000000003);
  assert.equal(model.comparisons.sumOfBest, 150);
});
test('skip, undo, reset and run changes replace state without preserving obsolete rows', () => {
  const model = new RunReadout(), s = fixture();
  s.timer.splitIndex = 2; applyBridgeSnapshot(model, s, 0);
  assert.ok(Math.abs(segmentMetrics(model).segment! - 24.45) < .001);
  s.attempt.segments.push(attemptSegment(1, ticks(80)));
  applyBridgeSnapshot(model, s, 0); assert.ok(Math.abs(segmentMetrics(model).segment! - 3.45) < .001);
  s.timer.splitIndex = 1; applyBridgeSnapshot(model, s, 0); assert.equal(model.history.rows.get(1)?.time, undefined);
  s.timer.phase = TimerPhase.NOT_RUNNING; applyBridgeSnapshot(model, s, 0);
  assert.equal(model.history.index, -1); assert.equal(model.history.rows.get(0)?.time, undefined);
  s.run.segments.splice(1); applyBridgeSnapshot(model, s, 0); assert.equal(model.count, 1); assert.equal(model.names.has(2), false);
});
test('ended PB and sum of best can be restored without an earlier connection', () => {
  const model = new RunReadout(), s = fixture(); s.timer.phase = TimerPhase.ENDED; s.timer.splitIndex = 3; s.timer.realTimeTicks = ticks(170);
  s.attempt.segments.push(attemptSegment(2, ticks(170)));
  applyBridgeSnapshot(model, s, 0); assert.equal(recordStates(model).pb, true); assert.equal(model.comparisons.sumOfBest, 150);
  s.context.currentTimingMethod = TimingMethod.GAME_TIME; s.timer.isGameTimeInitialized = false;
  applyBridgeSnapshot(model, s, 0); assert.equal(model.liveTime, '—'); assert.equal(recordStates(model).pb, false);
});
test('timer event cannot assign old attempt results to a new split', () => {
  const model = new RunReadout(), s = fixture(); s.timer.splitIndex = 2; s.attemptFresh = false;
  applyBridgeSnapshot(model, s, 0); assert.equal(model.history.index, 2);
  assert.equal(segmentMetrics(model).segment, null);
});
