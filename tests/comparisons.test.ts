import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Comparisons, comparisonNames } from '../src/comparisons.ts';

function sample(c: Comparisons, index = 1, phase = 'Running') {
  c.phase = phase; c.index = index;
  if (phase === 'Running' || phase === 'Paused') c.rows.set(index, new Map([
    ['Personal Best', { target: 120, previousDelta: -10, previousTime: 60 }],
    ['Average Segments', { target: 140, previousDelta: -15, previousTime: 60 }],
    ['Best Segments', { target: 80, previousDelta: 10, previousTime: 60 }],
  ]));
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
test('missing comparison and best values never create false deltas', () => {
  const c = new Comparisons();
  assert.equal(c.liveDelta(0, '', 123), null);
});

test('segment delta excludes earlier losses, before and after completion', () => {
  const c = new Comparisons(); sample(c);
  assert.equal(c.liveDelta(1, 'Best Segments', 89, true), null);
  assert.equal(c.liveDelta(1, 'Best Segments', 90, true), null);
  assert.equal(c.liveDelta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.liveDelta(1, 'Best Segments', 91), 11);
  assert.equal(c.delta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.delta(1, 'Best Segments', 88, true), -2);
  sample(c, 2, 'Ended');
  assert.equal(c.delta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.liveDelta(1, 'Best Segments', 91, true), null);
});
