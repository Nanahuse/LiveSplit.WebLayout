import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockTime, segmentMetrics } from '../src/readout.ts';
import { fixture, ticks } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';

test('segment timer handles missing history, skipped segments, pause and reset', () => {
  const s = fixture();
  s.timer.splitIndex = 2;
  s.timer.phase = 'paused';
  s.timer.realTimeTicks = ticks(80);
  s.attempt.segments[0].splitTime.realTimeTicks = ticks(60);
  let { model, clock } = readSnapshot(s);
  assert.equal(segmentMetrics(model, clockTime(model, clock)).segment, 20);
  assert.equal(segmentMetrics(model, clockTime(model, clock)).previous, null);
  assert.equal(segmentMetrics(model, clockTime(model, { ...clock, splitIndex: 3 })).segment, null);
  s.timer.phase = 'not_running';
  ({ model, clock } = readSnapshot(s));
  assert.deepEqual(segmentMetrics(model, clockTime(model, clock)), { segment: null, previous: null, delta: null });
});
