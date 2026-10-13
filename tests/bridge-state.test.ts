import { test } from 'node:test';
import assert from 'node:assert/strict';
import { create } from '@bufbuild/protobuf';
import { applyBridgeSnapshot, timeSpan } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';
import { columnValue } from '../src/columns.ts';
import { recordStates } from '../src/record-colors.ts';
import { segmentMetrics } from '../src/segment-metrics.ts';
import { AttemptSegmentSchema, TimerPhase, TimingMethod } from '../src/generated/livesplit/bridge/v3/common_pb.ts';
import { fixture, ticks } from './bridge-fixture.ts';

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
  s.attempt.segments.push(create(AttemptSegmentSchema, { index: 1, splitTime: { realTimeTicks: ticks(80) } }));
  applyBridgeSnapshot(model, s, 0); assert.ok(Math.abs(segmentMetrics(model).segment! - 3.45) < .001);
  s.timer.splitIndex = 1; applyBridgeSnapshot(model, s, 0); assert.equal(model.history.rows.get(1)?.time, undefined);
  s.timer.phase = TimerPhase.NOT_RUNNING; applyBridgeSnapshot(model, s, 0);
  assert.equal(model.history.index, -1); assert.equal(model.history.rows.get(0)?.time, undefined);
  s.run.segments.splice(1); applyBridgeSnapshot(model, s, 0); assert.equal(model.count, 1); assert.equal(model.names.has(2), false);
});
test('ended PB and sum of best can be restored without an earlier connection', () => {
  const model = new RunReadout(), s = fixture(); s.timer.phase = TimerPhase.ENDED; s.timer.splitIndex = 3; s.timer.realTimeTicks = ticks(170);
  s.attempt.segments.push(create(AttemptSegmentSchema, { index: 2, splitTime: { realTimeTicks: ticks(170) } }));
  applyBridgeSnapshot(model, s, 0); assert.equal(recordStates(model).pb, true); assert.equal(model.comparisons.sumOfBest, 150);
  s.context.currentTimingMethod = TimingMethod.GAME_TIME; s.timer.isGameTimeInitialized = false;
  applyBridgeSnapshot(model, s, 0); assert.equal(model.liveTime, '—'); assert.equal(recordStates(model).pb, false);
});
test('timer event cannot assign old attempt results to a new split', () => {
  const model = new RunReadout(), s = fixture(); s.timer.splitIndex = 2; s.attemptFresh = false;
  applyBridgeSnapshot(model, s, 0); assert.equal(model.history.index, 2);
  assert.equal(segmentMetrics(model).segment, null);
});
