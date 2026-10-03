import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Comparisons, comparisonNames } from '../src/comparisons.ts';

function sample(c: Comparisons, index = 1, phase = 'Running', end = index) {
  c.names = new Set(['Personal Best', 'Average Segments']); c.begin();
  const values: Record<string, string> = {
    getcurrenttimerphase: phase, getsplitindex: String(index), gettimingmethod: 'RealTime', getcomparisonname: 'Personal Best',
    'getcomparisonsplittime Personal Best': '00:02:00', 'getdelta Personal Best': '-00:00:10',
    'getcomparisonsplittime Average Segments': '00:02:20', 'getdelta Average Segments': '-00:00:15',
    'getcomparisonsplittime Best Segments': '00:01:20', 'getdelta Best Segments': '00:00:10',
  };
  let indices = 0;
  while (c.next()) {
    const command = c.next()!;
    c.receive(command === 'getsplitindex' && ++indices > 1 ? String(end) : values[command]);
  }
}
test('comparison names preserve spaces, deduplicate and reject line breaks', () => {
  assert.deepEqual(comparisonNames(' Personal Best | Best Segments |Personal Best|bad\nname'), ['Personal Best', 'Best Segments']);
  assert.deepEqual(comparisonNames(null), ['']);
});
test('live delta starts after best pace, stays live, and supports independent comparisons', () => {
  const c = new Comparisons(); sample(c);
  assert.equal(c.liveDelta(1, 'Personal Best', 89), null);
  assert.equal(c.liveDelta(1, 'Personal Best', 90), null);
  assert.equal(c.liveDelta(1, 'Personal Best', 91), -29);
  assert.equal(c.liveDelta(1, 'Personal Best', 92), -28);
  assert.equal(c.liveDelta(1, 'Average Segments', 92), -48);
  assert.equal(c.liveDelta(1, 'Personal Best', 121), 1);
  assert.equal(c.liveDelta(2, 'Personal Best', 121), null);
  sample(c, 1, 'Paused'); assert.equal(c.liveDelta(1, 'Personal Best', 92), -28);
});
test('discards crossed snapshots, clears undo/reset, and retains completed targets', () => {
  const c = new Comparisons(); sample(c, 1, 'Running', 2); assert.equal(c.rows.size, 0);
  sample(c, 1); sample(c, 2); assert.ok(c.rows.has(1));
  sample(c, 1); assert.equal(c.rows.has(2), false);
  sample(c, 2, 'Ended'); assert.equal(c.liveDelta(1, 'Personal Best', 121), null);
  sample(c, -1, 'NotRunning'); assert.equal(c.rows.size, 0);
});
test('missing comparison and best values never create false deltas', () => {
  const c = new Comparisons(); c.begin();
  while (c.next()) c.receive('-');
  assert.equal(c.liveDelta(0, '', 123), null);
});
