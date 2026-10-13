import { test } from 'node:test';
import assert from 'node:assert/strict';
import { create } from '@bufbuild/protobuf';
import { fixture, ticks } from './bridge-fixture.ts';
import { TimerPhase, AttemptSegmentSchema } from '../src/generated/livesplit/bridge/v3/common_pb.ts';
import { applyBridgeSnapshot } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';
import { columnValue } from '../src/columns.ts';
import type { ColumnType } from '../src/columns.ts';

// Expected values follow SplitComponent.UpdateColumn and LiveSplitStateHelper.
test('six native time columns switch between references, live deltas, actuals and missing actuals', () => {
  const s = fixture(), model = new RunReadout();
  const types: ColumnType[] = ['SplitTime', 'SegmentTime', 'Delta', 'SegmentDelta', 'DeltaorSplitTime', 'SegmentDeltaorSegmentTime'];
  const values = (index: number) => types.map(type => columnValue(model, index, { name: type, type, comparison: 'Personal Best' }, true).value);
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1;
  applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [120, 60, null, null, 120, 60]);
  s.timer.phase = TimerPhase.RUNNING; s.timer.splitIndex = 1; s.timer.realTimeTicks = ticks(100);
  applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [120, 60, null, null, 120, 60]);
  s.timer.realTimeTicks = ticks(110); applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [120, 60, -10, -9, -10, -9]);
  assert.equal(columnValue(model, 1, { name: 'Delta', type: 'Delta', comparison: 'Personal Best' }, true, false).value, null);
  s.timer.phase = TimerPhase.PAUSED; applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [120, 60, -10, -9, -10, -9]);
  s.timer.splitIndex = 2;
  s.attempt.segments.push(create(AttemptSegmentSchema, { index: 1, splitTime: { realTimeTicks: ticks(110) } }));
  applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [110, 51, -10, -9, -10, -9]);
  s.attempt.segments[1].splitTime = undefined; applyBridgeSnapshot(model, s, 0);
  assert.deepEqual(values(1), [null, null, null, null, null, null]);
});

test('native segment references and deltas skip missing comparisons independently of actuals', () => {
  const s = fixture(), model = new RunReadout();
  s.run.segments[1].comparisons.find(c => c.name === 'Personal Best')!.time = undefined;
  s.timer.phase = TimerPhase.ENDED; s.timer.splitIndex = 3;
  s.attempt.segments.push(create(AttemptSegmentSchema, { index: 1, splitTime: { realTimeTicks: ticks(110) } }),
    create(AttemptSegmentSchema, { index: 2, splitTime: { realTimeTicks: ticks(170) } }));
  applyBridgeSnapshot(model, s, 0);
  const get = (type: ColumnType, comparison = 'Personal Best') => columnValue(model, 2, { name: '', type, comparison }, true).value;
  assert.equal(get('SegmentTime'), 60); // previous actual 110
  assert.equal(get('SegmentDelta'), -9); // previous comparable actual 59 vs 60
  assert.equal(get('SplitTime', 'Removed Comparison'), 170);
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; applyBridgeSnapshot(model, s, 0);
  assert.equal(get('SegmentTime'), 120); // previous non-null comparison 60
  assert.equal(get('SplitTime', 'Removed Comparison'), 180); // current comparison fallback
  s.run.segments[0].bestSegmentTime!.realTimeTicks = ticks(40); applyBridgeSnapshot(model, s, 0);
  assert.equal(columnValue(model, 0, { name: '', type: 'SegmentTime', comparison: 'Best Segments' }, true).value, 50);
  assert.equal(columnValue(model, 0, { name: '', type: 'ComparisonSegmentTime', comparison: 'Best Segments' }, true).value, 40);
});

test('Custom Variable uses column Name, live context and completed attempt values, including empty strings', () => {
  const s = fixture(), model = new RunReadout();
  s.attempt.segments[0].customVariables.Deaths = '3';
  const column = { name: 'Deaths', type: 'CustomVariable' as const, comparison: '' };
  applyBridgeSnapshot(model, s, 0);
  assert.equal(columnValue(model, 0, column, true).text, '3');
  assert.equal(columnValue(model, 1, column, true).text, '<b>42</b>');
  assert.equal(columnValue(model, 2, column, true).text, '');
  s.context.customVariables.Deaths = ''; applyBridgeSnapshot(model, s, 0);
  assert.equal(columnValue(model, 1, column, true).text, '');
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; applyBridgeSnapshot(model, s, 0);
  assert.equal(columnValue(model, 0, column, true).text, '');
});
