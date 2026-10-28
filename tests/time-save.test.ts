import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { fixture, ticks } from './bridge-fixture.ts';
import { applyBridgeSnapshot } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';
import { possibleTimeSave, totalPossibleTimeSave, previousSegment, renderTimeSave, timeSaveSettings } from '../src/time-save.ts';
import { TimerPhase, TimingMethod } from '../src/generated/protocol.ts';

test('possible save uses bests, combines missing comparison segments and clamps live total', () => {
  const s = fixture(), run = new RunReadout(); applyBridgeSnapshot(run, s, 0);
  assert.equal(possibleTimeSave(run, 1, 'Personal Best'), 10);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 20);
  s.timer.realTimeTicks = ticks(115); applyBridgeSnapshot(run, s, 0);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 14);
  assert.deepEqual(previousSegment(run, 'Personal Best'), { delta: -4, save: 10, live: true, index: 1 });
  s.timer.phase = TimerPhase.PAUSED; applyBridgeSnapshot(run, s, 0);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 14);
  s.timer.realTimeTicks = ticks(125); applyBridgeSnapshot(run, s, 0);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 10);
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; applyBridgeSnapshot(run, s, 0);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 30);
  assert.equal(previousSegment(run, 'Personal Best').delta, null);
  s.run.segments[0].comparisons.find(c => c.name === 'Personal Best')!.time = {};
  applyBridgeSnapshot(run, s, 0); assert.equal(possibleTimeSave(run, 1, 'Personal Best'), 20);
  s.run.segments[0].bestSegmentTime = {};
  applyBridgeSnapshot(run, s, 0); assert.equal(possibleTimeSave(run, 1, 'Personal Best'), null);
  s.timer.phase = TimerPhase.ENDED; applyBridgeSnapshot(run, s, 0);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), 0);
});

test('previous delta restores after reconnect, handles skip, game time and stale attempts', () => {
  const s = fixture(), run = new RunReadout(); applyBridgeSnapshot(run, s, 0);
  assert.deepEqual(previousSegment(run, 'Missing comparison'), { delta: -1, save: 10, live: false, index: 0 });
  s.context.currentTimingMethod = TimingMethod.GAME_TIME; applyBridgeSnapshot(run, s, 0);
  assert.equal(possibleTimeSave(run, 0, 'Personal Best'), 5);
  s.timer.splitIndex = 2; applyBridgeSnapshot(run, s, 0);
  assert.equal(previousSegment(run, 'Personal Best').delta, null);
  s.attemptFresh = false; applyBridgeSnapshot(run, s, 0);
  assert.equal(previousSegment(run, 'Personal Best').index, -1);
  assert.equal(totalPossibleTimeSave(run, 'Personal Best'), null);
});

test('native settings render delta / save, live labels, precision and custom layouts', async () => {
  const dom = new Window();
  try {
    const s = fixture(), run = new RunReadout(); applyBridgeSnapshot(run, s, 0);
    const root = dom.document.createElement('livesplit-previous-segment');
    root.innerHTML = '<span class="ls-label"></span><span data-ls-field="previous-segment-delta"></span>';
    const element = root as unknown as HTMLElement;
    root.setAttribute('settings', '{"ShowPossibleTimeSave":true,"Display2Rows":true}');
    renderTimeSave(run, element, true);
    assert.equal(root.querySelector('[data-ls-field]')?.textContent, '-1.0 / 10.0');
    assert.equal(root.querySelector('.ls-label')?.textContent, 'Previous Segment');
    s.timer.realTimeTicks = ticks(115); applyBridgeSnapshot(run, s, 0); renderTimeSave(run, element, true);
    assert.equal(root.querySelector('.ls-label')?.textContent, 'Live Segment');
    assert.equal(root.querySelector('[data-ls-field]')?.textContent, '-4.0 / 10.0');
    root.setAttribute('label', '<b>Custom</b>'); root.setAttribute('hide-label', ''); renderTimeSave(run, element, true);
    assert.equal(root.querySelector('.ls-label')?.textContent, '<b>Custom</b>');
    assert.ok(root.querySelector('.ls-label')?.hasAttribute('hidden'));
    assert.equal(root.querySelector('b'), null);
    root.setAttribute('settings', '{"DeltaAccuracy":"invalid"}'); assert.throws(() => timeSaveSettings(element));
    const possible = dom.document.createElement('livesplit-possible-time-save');
    possible.innerHTML = '<span class="ls-label"></span><span data-ls-field="possible-time-save"></span>';
    possible.setAttribute('settings', '{"TotalTimeSave":true}'); renderTimeSave(run, possible as unknown as HTMLElement, true);
    assert.equal(possible.querySelector('[data-ls-field]')?.textContent, '14.00');
  } finally { await dom.happyDOM.close(); }
});
