import { test } from 'node:test';
import assert from 'node:assert/strict';
import { columnsFor, columnValue, visibleSplits } from '../src/columns.ts';
import type { ColumnType } from '../src/columns.ts';
import { fixture, attemptSegment, ticks } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';

test('column widths accept explicit units and reject invalid dimensions', () => {
  assert.equal(columnsFor([{ Type: 'Comparison Segment Time', Comparison: 'Best Segments' }])[0].type, 'ComparisonSegmentTime');
  const widths = [100, '7ch', '25%', 'auto'];
  assert.deepEqual(columnsFor(widths.map(Width => ({ Type: 'Split Time', Width }))).map(c => c.width), ['100px', '7ch', '25%', 'auto']);
  for (const Width of [-1, 'wide', '20px; color:red']) assert.throws(() => columnsFor([{ Type: 'Delta', Width }]), /Width/);
});

test('native column types distinguish cumulative delta, segment delta, and fallback times', () => {
  const s = fixture();
  s.run.segments[0].comparisons[1].time.realTimeTicks = ticks(50);
  s.run.segments[1].comparisons[1].time.realTimeTicks = ticks(80);
  s.run.segments[1].bestSegmentTime.realTimeTicks = ticks(30);
  s.attempt.segments[0].splitTime.realTimeTicks = ticks(60);
  s.timer.realTimeTicks = ticks(89);
  const value = (type: ColumnType) => {
    const { model, clock } = readSnapshot(s);
    return columnValue(model, 1, { name: 'Best', type, comparison: 'Best Segments' }, true, true, clock);
  };
  assert.deepEqual(value('SplitTime'), { value: 80, delta: false });
  assert.deepEqual(value('SegmentTime'), { value: 30, delta: false });
  assert.deepEqual(value('Delta'), { value: 9, delta: true });
  assert.deepEqual(value('SegmentDelta'), { value: null, delta: true });
  assert.deepEqual(value('SegmentDeltaorSegmentTime'), { value: 30, delta: false });
  s.timer.realTimeTicks = ticks(91);
  assert.deepEqual(value('SegmentDeltaorSegmentTime'), { value: 1, delta: true });
  s.attempt.segments.push(attemptSegment(1, ticks(91)));
  s.timer.splitIndex = 2;
  s.timer.phase = 'ended';
  assert.deepEqual(value('SplitTime'), { value: 91, delta: false });
  assert.deepEqual(value('SegmentTime'), { value: 31, delta: false });
  assert.deepEqual(value('SegmentDelta'), { value: 1, delta: true });
  assert.deepEqual(value('Delta'), { value: 11, delta: true });
  assert.deepEqual(value('ComparisonTime'), { value: 80, delta: false });
});

test('missing baseline does not turn cumulative losses into a segment delta', () => {
  const s = fixture();
  s.attemptFresh = false;
  s.timer.realTimeTicks = ticks(130);
  const { model, clock } = readSnapshot(s);
  assert.deepEqual(columnValue(model, 1, { name: '', type: 'SegmentDelta', comparison: 'Best Segments' }, true, true, clock), { value: null, delta: true });
});

test('columns preserve order and accept the documented keys', () => {
  const columns = columnsFor([{ Type: 'SegmentDelta', Name: '<Best>', Comparison: 'Best Segments' }, { Type: 'SplitTime' }]);
  assert.equal(columns[0].name, '<Best>'); assert.equal(columns[1].comparison, '');
  assert.throws(() => columnsFor([{ Type: 'invalid' }]));
  assert.throws(() => columnsFor([{ type: 'Delta' }]));
  assert.deepEqual(columnsFor([]), []);
});

test('visible split window follows current split, includes previews and pins final row', () => {
  assert.deepEqual(visibleSplits(10, 4, 5, 1, true), [2, 3, 4, 5, 9]);
  assert.deepEqual(visibleSplits(10, 4, 5, 1, false), [1, 2, 3, 4, 5]);
  assert.deepEqual(visibleSplits(10, 10, 5, 1, true), [5, 6, 7, 8, 9]);
  assert.deepEqual(visibleSplits(2, -1, 5, 1, true), [0, 1]);
});
