import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { fixture, ticks } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';
import { possibleTimeSave, prepareTotalTimeSave, previousSegment, timeSaveDisplay, timeSaveSettings } from '../src/time-save.ts';
import { TimerPhase, TimingMethod } from '../src/generated/protocol.ts';

test('possible save uses bests, combines missing comparison segments and clamps live total', () => {
  const s = fixture(); let { model: run, clock } = readSnapshot(s);
  assert.equal(possibleTimeSave(run, 1, 'Personal Best'), 10);
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 20);
  s.timer.realTimeTicks = ticks(115); ({ model: run, clock } = readSnapshot(s));
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 14);
  assert.deepEqual(previousSegment(run, 'Personal Best', clock[run.timingMethod]), { delta: -4, save: 10, live: true, index: 1 });
  s.timer.phase = TimerPhase.PAUSED; ({ model: run, clock } = readSnapshot(s));
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 14);
  s.timer.realTimeTicks = ticks(125); ({ model: run, clock } = readSnapshot(s));
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 10);
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; ({ model: run, clock } = readSnapshot(s));
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 30);
  assert.equal(previousSegment(run, 'Personal Best', clock[run.timingMethod]).delta, null);
  s.run.segments[0].comparisons.find(c => c.name === 'Personal Best')!.time = {};
  ({ model: run, clock } = readSnapshot(s)); assert.equal(possibleTimeSave(run, 1, 'Personal Best'), 20);
  s.run.segments[0].bestSegmentTime = {};
  ({ model: run, clock } = readSnapshot(s)); assert.equal(possibleTimeSave(run, 1, 'Personal Best'), null);
  s.timer.phase = TimerPhase.ENDED; ({ model: run, clock } = readSnapshot(s));
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), 0);
});

test('previous delta restores after reconnect, handles skip, game time and stale attempts', () => {
  const s = fixture(); let { model: run, clock } = readSnapshot(s);
  assert.deepEqual(previousSegment(run, 'Missing comparison', clock[run.timingMethod]), { delta: -1, save: 10, live: false, index: 0 });
  s.context.currentTimingMethod = TimingMethod.GAME_TIME; ({ model: run, clock } = readSnapshot(s));
  assert.equal(possibleTimeSave(run, 0, 'Personal Best'), 5);
  s.timer.splitIndex = 2; ({ model: run, clock } = readSnapshot(s));
  assert.equal(previousSegment(run, 'Personal Best', clock[run.timingMethod]).delta, null);
  s.attemptFresh = false; ({ model: run, clock } = readSnapshot(s));
  assert.equal(previousSegment(run, 'Personal Best', clock[run.timingMethod]).index, -1);
  assert.equal(prepareTotalTimeSave(run, 'Personal Best')(clock[run.timingMethod]), null);
});

test('native settings format delta and save, live labels and precision', async () => {
  const dom = new Window();
  try {
    const s = fixture();
    let { model: run, clock } = readSnapshot(s);
    const root = dom.document.createElement('livesplit-previous-segment') as unknown as HTMLElement;
    root.setAttribute('settings', '{"ShowPossibleTimeSave":true,"Display2Rows":true}');
    const settings = timeSaveSettings(root);
    assert.equal(settings.Display2Rows, true);
    assert.equal(timeSaveDisplay(run, settings, true)(clock.realTime).value, '-1.0 / 10.0');
    assert.equal(timeSaveDisplay(run, settings, true)(clock.realTime).label, 'Previous Segment');
    s.timer.realTimeTicks = ticks(115);
    ({ model: run, clock } = readSnapshot(s));
    const live = timeSaveDisplay(run, settings, true)(clock.realTime);
    assert.equal(live.label, 'Live Segment');
    assert.equal(live.value, '-4.0 / 10.0');
    root.setAttribute('settings', '{"DeltaAccuracy":"invalid"}');
    assert.throws(() => timeSaveSettings(root));
    const possible = dom.document.createElement('livesplit-possible-time-save') as unknown as HTMLElement;
    possible.setAttribute('settings', '{"TotalTimeSave":true}');
    assert.equal(timeSaveDisplay(run, timeSaveSettings(possible), false)(clock.realTime).value, '14.00');
  } finally { await dom.happyDOM.close(); }
});