import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunReadout } from '../src/readout.ts';
import { columnsFor, columnValue, visibleSplits } from '../src/columns.ts';
import type { ColumnType } from '../src/columns.ts';

const element = (attrs: Record<string, string>) => ({ getAttribute: (name: string) => attrs[name] ?? null }) as Element;
test('column widths accept explicit units and reject invalid dimensions', () => {
  assert.equal(columnsFor(element({ columns: '[{"Type":"Comparison Segment Time","Comparison":"Best Segments"}]' }))[0].type, 'ComparisonSegmentTime');
  const widths = [100, '7ch', '25%', 'auto'];
  const root = element({ columns: JSON.stringify(widths.map(Width => ({ Type: 'Split Time', Width }))) });
  assert.deepEqual(columnsFor(root).map(c => c.width), ['100px', '7ch', '25%', 'auto']);
  for (const Width of [-1, 'wide', '20px; color:red']) {
    assert.throws(() => columnsFor(element({ columns: JSON.stringify([{ Type: 'Delta', Width }]) })), /Width/);
  }
});
function fixture() {
  const run = new RunReadout();
  run.history.index = 1; run.history.phase = 'Running';
  run.values.set('getsplitindex', '1'); run.values.set('getcurrenttimerphase', 'Running');
  run.comparisons.index = 1; run.comparisons.phase = 'Running';
  run.comparisons.rows.set(1, new Map([['Best Segments', { target: 80, previousDelta: 10, previousTime: 60, segmentTarget: 30 }]]));
  run.bestSegments.set(1, 30); run.comparisons.bestSegments.set(1, 30);
  run.liveTime = '1:29.00';
  return run;
}
test('native column types distinguish cumulative delta, segment delta, and fallback times', () => {
  const run = fixture();
  const value = (type: ColumnType) => columnValue(run, 1, { name: 'Best', type, comparison: 'Best Segments' }, true);
  assert.deepEqual(value('SplitTime'), { value: 80, delta: false });
  assert.deepEqual(value('SegmentTime'), { value: 30, delta: false });
  assert.deepEqual(value('Delta'), { value: 9, delta: true });
  assert.deepEqual(value('SegmentDelta'), { value: null, delta: true });
  assert.deepEqual(value('SegmentDeltaorSegmentTime'), { value: 30, delta: false });
  run.liveTime = '1:31.00';
  assert.deepEqual(value('SegmentDeltaorSegmentTime'), { value: 1, delta: true });
  run.history.rows.set(1, { index: 1, time: '00:01:31' });
  run.history.index = 2; run.history.phase = 'Ended';
  assert.deepEqual(value('SplitTime'), { value: 91, delta: false });
  assert.deepEqual(value('SegmentTime'), { value: 31, delta: false });
  assert.deepEqual(value('SegmentDelta'), { value: 1, delta: true });
  assert.deepEqual(value('Delta'), { value: 11, delta: true });
  assert.deepEqual(value('ComparisonTime'), { value: 80, delta: false });
});
test('missing baseline does not turn cumulative losses into a segment delta', () => {
  const run = fixture();
  run.comparisons.rows.get(1)!.set('Best Segments', { target: 80, previousDelta: null });
  run.liveTime = '1:31.00';
  assert.deepEqual(columnValue(run, 1, { name: '', type: 'SegmentDelta', comparison: 'Best Segments' }, true), { value: null, delta: true });
});
test('columns preserve order, validate input and default Best Segments to segment delta', () => {
  const defaults = columnsFor(element({ comparisons: 'Personal Best|Best Segments' }));
  assert.equal(defaults[1].type, 'Delta'); assert.equal(defaults[3].type, 'SegmentDelta');
  const columns = columnsFor(element({ columns: JSON.stringify([{ type: 'SegmentDelta', name: '<Best>', comparison: 'Best Segments' }, { type: 'SplitTime' }]) }));
  assert.equal(columns[0].name, '<Best>'); assert.equal(columns[1].comparison, '');
  assert.throws(() => columnsFor(element({ columns: '[{"type":"invalid"}]' })));
  assert.deepEqual(columnsFor(element({ columns: '[]' })), []);
});
test('visible split window follows current split, includes previews and pins final row', () => {
  assert.deepEqual(visibleSplits(10, 4, 5, 1, true), [2, 3, 4, 5, 9]);
  assert.deepEqual(visibleSplits(10, 4, 5, 1, false), [1, 2, 3, 4, 5]);
  assert.deepEqual(visibleSplits(10, 10, 5, 1, true), [5, 6, 7, 8, 9]);
  assert.deepEqual(visibleSplits(2, -1, 5, 1, true), [0, 1]);
});
