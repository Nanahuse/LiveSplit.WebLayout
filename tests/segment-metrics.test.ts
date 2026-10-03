import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunReadout } from '../src/readout.ts';
import { segmentMetrics } from '../src/segment-metrics.ts';
import { Comparisons } from '../src/comparisons.ts';

test('segment timer handles missing history, skipped segments, pause and reset', () => {
  const run = new RunReadout();
  run.history.index = 2; run.history.phase = 'Paused'; run.liveTime = '1:20.00';
  run.values.set('getsplitindex', '2'); run.values.set('getcurrenttimerphase', 'Paused');
  assert.equal(segmentMetrics(run).segment, null);
  run.history.rows.set(1, { index: 1 });
  run.history.rows.set(0, { index: 0, time: '00:01:00' });
  assert.equal(segmentMetrics(run).segment, 20);
  assert.equal(segmentMetrics(run).previous, null);
  run.values.set('getsplitindex', '3');
  assert.equal(segmentMetrics(run).segment, null); // crossed snapshot
  run.clear(); assert.deepEqual(segmentMetrics(run), { segment: null, previous: null, delta: null });
});
test('Sum of Best uses a consistent snapshot, not the actual finishing time', () => {
  const c = new Comparisons();
  function sample(phase: string, time: string, method = 'RealTime', finalPhase = phase) {
    c.begin(); let phases = 0;
    const values: Record<string, string> = { getcurrenttimerphase: phase, getsplitindex: phase === 'Ended' ? '3' : '0', gettimingmethod: method, getcomparisonname: 'Personal Best', 'getfinaltime Best Segments': time };
    while (c.next()) { const cmd = c.next()!; c.receive(cmd === 'getcurrenttimerphase' && ++phases > 1 ? finalPhase : values[cmd] ?? '-'); }
  }
  sample('Running', '00:05:00'); assert.equal(c.sumOfBest, 300);
  sample('Running', '00:08:00', 'RealTime', 'Ended'); assert.equal(c.sumOfBest, 300);
  sample('Ended', '00:08:00'); assert.equal(c.sumOfBest, 300);
  sample('Ended', '00:07:00', 'GameTime'); assert.equal(c.sumOfBest, null);
  sample('NotRunning', '00:04:00', 'GameTime'); assert.equal(c.sumOfBest, 240);
  c.clear(); assert.equal(c.sumOfBest, null);
});
