import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunReadout } from '../src/readout.ts';
import { segmentMetrics } from '../src/segment-metrics.ts';


test('segment timer handles missing history, skipped segments, pause and reset', () => {
  const run = new RunReadout();
  run.history.index = 2; run.history.phase = 'Paused'; run.liveTime = '1:20.00';
  run.values.set('getsplitindex', '2'); run.values.set('getcurrenttimerphase', 'Paused');
  assert.equal(segmentMetrics(run).segment, null);
  run.history.rows.set(1, { index: 1 });
  run.history.rows.set(0, { index: 0, time: '00:01:00' });
  run.comparisons.rows.set(2, new Map([['', { target: null, previousDelta: null, previousTime: 60 }]]));
  assert.equal(segmentMetrics(run).segment, 20);
  assert.equal(segmentMetrics(run).previous, null);
  run.values.set('getsplitindex', '3');
  assert.equal(segmentMetrics(run).segment, null); // crossed snapshot
  run.clear(); assert.deepEqual(segmentMetrics(run), { segment: null, previous: null, delta: null });
});
