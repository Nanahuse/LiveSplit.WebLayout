import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Comparisons } from '../src/comparisons.ts';

function sample(index = 1, phase: 'running' | 'paused' | 'ended' = 'running') {
  const c = new Comparisons(index, phase, new Map([[1, 30]]));
  c.rows.set(1, new Map([
    ['Personal Best', { target: 120, previousDelta: -10, previousTime: 60, segmentTarget: 60 }],
    ['Average Segments', { target: 140, previousDelta: -15, previousTime: 60, segmentTarget: 80 }],
    ['Best Segments', { target: 80, previousDelta: 10, previousTime: 60, segmentTarget: 30 }],
  ]));
  return c;
}

test('live delta starts after best pace, stays live, and supports independent comparisons', () => {
  let c = sample();
  assert.equal(c.liveDelta(1, 'Personal Best', 89), null);
  assert.equal(c.liveDelta(1, 'Personal Best', 90), null);
  assert.equal(c.liveDelta(1, 'Personal Best', 91), -29);
  assert.equal(c.liveDelta(1, 'Personal Best', 92), -28);
  assert.equal(c.liveDelta(1, 'Average Segments', 92), -48);
  assert.equal(c.liveDelta(1, 'Personal Best', 121), 1);
  assert.equal(c.liveDelta(2, 'Personal Best', 121), null);
  c = sample(1, 'paused'); assert.equal(c.liveDelta(1, 'Personal Best', 92), -28);
});
test('missing comparison and best values never create false deltas', () => {
  const c = new Comparisons(0, 'running', new Map());
  assert.equal(c.liveDelta(0, '', 123), null);
});

test('segment delta excludes earlier losses, before and after completion', () => {
  let c = sample();
  assert.equal(c.liveDelta(1, 'Best Segments', 89, true), null);
  assert.equal(c.liveDelta(1, 'Best Segments', 90, true), null);
  assert.equal(c.liveDelta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.liveDelta(1, 'Best Segments', 91), 11);
  assert.equal(c.delta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.delta(1, 'Best Segments', 88, true), -2);
  c = sample(2, 'ended');
  assert.equal(c.delta(1, 'Best Segments', 91, true), 1);
  assert.equal(c.liveDelta(1, 'Best Segments', 91, true), null);
});
