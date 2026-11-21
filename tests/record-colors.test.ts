import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timerColor, recordEffect } from '../src/record-colors.ts';
import { fixture, attemptSegment, ticks } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';

test('PB depends on Personal Best even when a different comparison is selected', () => {
  const s = fixture();
  s.context.currentComparison = 'Best Segments';
  s.timer.phase = 'ended';
  s.timer.splitIndex = 3;
  s.attempt.segments.push(attemptSegment(1, ticks(125)), attemptSegment(2, ticks(170)));
  let { model } = readSnapshot(s);
  assert.equal(model.personalBest, true);
  assert.equal(model.isBestSegment(2), true);
  assert.equal(timerColor(model, 170), 'pb');
  s.attempt.segments[2].splitTime.realTimeTicks = ticks(180);
  ({ model } = readSnapshot(s));
  assert.equal(model.personalBest, false);
  assert.equal(model.isBestSegment(2), false);
  s.run.segments[2].comparisons[0].time = {};
  ({ model } = readSnapshot(s));
  assert.equal(model.personalBest, true); // existing comparison with an explicitly unset time
  s.run.segments[2].comparisons.shift();
  ({ model } = readSnapshot(s));
  assert.equal(model.personalBest, false); // no PB baseline was provided for this split
  s.attemptFresh = false;
  ({ model } = readSnapshot(s));
  assert.equal(timerColor(model, 170), 'unknown');
});

test('live timer color responds to phase and changes in comparison delta', () => {
  const s = fixture();
  let { model } = readSnapshot(s);
  assert.equal(timerColor(model, 90), 'ahead-gaining');
  assert.equal(timerColor(model, 119.5), 'ahead-losing');
  assert.equal(timerColor(model, 130), 'behind-losing');
  s.attempt.segments[0].splitTime.realTimeTicks = ticks(80);
  ({ model } = readSnapshot(s));
  assert.equal(timerColor(model, 130), 'behind-gaining');
  s.timer.phase = 'paused';
  ({ model } = readSnapshot(s));
  assert.equal(timerColor(model, 130), 'paused');
  assert.equal(timerColor(model, -1), 'not-running');
  assert.equal(timerColor(model, null), 'unknown');
});

test('running timer uses the unknown color when the selected comparison has no time', () => {
  const s = fixture();
  const target = s.run.segments[s.timer.splitIndex].comparisons.find(c => c.name === s.context.currentComparison)!;
  delete target.time.realTimeTicks;
  let { model, clock } = readSnapshot(s);
  assert.equal(timerColor(model, clock.realTime), 'unknown');

  target.time.realTimeTicks = 0n;
  ({ model, clock } = readSnapshot(s));
  assert.equal(timerColor(model, clock.realTime), 'behind-losing');
});

test('record effect settings validate colors independently', () => {
  const root = { getAttribute: (name: string) => ({ 'pb-effect': 'rainbow', 'bs-effect': 'none' })[name as 'pb-effect'] } as Element;
  assert.equal(recordEffect(root, 'pb-effect'), 'rainbow');
  assert.equal(recordEffect(root, 'bs-effect'), 'none');
  assert.throws(() => recordEffect({ getAttribute: () => 'invalid' } as unknown as Element, 'bs-effect'));
});
