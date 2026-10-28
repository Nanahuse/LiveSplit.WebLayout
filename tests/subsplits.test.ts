import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { sectionsFor, subsplitName, subsplitRows, subsplitValue, sectionTimes, subsplitDefaults } from '../src/subsplits.ts';
import { splitDefaults, subsplitSettings } from '../src/split-settings.ts';
import { renderSplits, updateLiveSplits } from '../src/split-view.ts';
import { applyBridgeSnapshot } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';
import { fixture, ticks, attemptSegment } from './bridge-fixture.ts';
import { TimerPhase } from '../src/generated/protocol.ts';

const names = ['-Road 1', '-Road 2', '{Stage 1}Boss', '-Road', '{Stage 2}Boss'];
const settings = { ...splitDefaults, ...subsplitDefaults, ShowBlankSplits: false };
test('native grouping and names include singleton, trailing dash and literal HTML cases', () => {
  assert.deepEqual(sectionsFor(names), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
  assert.deepEqual(sectionsFor(['Solo', '-Last']), [{ start: 0, end: 0 }, { start: 1, end: 1 }]);
  assert.equal(subsplitName(names[2], 2, 5, true), 'Stage 1');
  assert.equal(subsplitName(names[2], 2, 5), 'Boss');
  assert.equal(subsplitName('-Road', 0, 5), 'Road');
  assert.equal(subsplitName('-Last', 1, 2), '-Last');
  assert.equal(subsplitName('{<b>Stage</b>}Boss', 2, 5, true), '<b>Stage</b>');
});
test('automatic, all-expanded, all-collapsed and current-section selection respects row budget', () => {
  const simple = (position: number, extra = {}) => subsplitRows(names, position, { ...settings, ...extra }).map(r => r && [r.index, !!r.header, !!r.collapsed]);
  assert.deepEqual(simple(-1), [[2, true, false], [0, false, false], [1, false, false], [2, false, false], [4, false, true]]);
  assert.deepEqual(simple(3), [[2, false, true], [4, true, false], [3, false, false], [4, false, false]]);
  assert.deepEqual(simple(3, { ShowSubsplits: true, ShowHeader: false }), [0,1,2,3,4].map(i => [i,false,false]));
  assert.deepEqual(simple(0, { HideSubsplits: true, ShowHeader: false }), [[2,false,true],[4,false,true]]);
  assert.deepEqual(simple(0, { CurrentSectionOnly: true, AlwaysShowLastSplit: false, ShowHeader: false }), [0,1,2].map(i => [i,false,false]));
  for (const position of [-1,0,2,3,5]) for (const budget of [1,2,3,8]) {
    const rows = subsplitRows(names, position, { ...settings, VisualSplitCount: budget, ShowBlankSplits: true });
    assert.equal(rows.length, budget);
    assert.equal(rows.at(-1)?.index, 4);
  }
  assert.deepEqual(subsplitRows([], -1, settings), []);
});
test('collapsed segment columns aggregate whole sections and use strict boundary times', () => {
  const s = fixture(), run = new RunReadout();
  s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; applyBridgeSnapshot(run, s, 0);
  const row = { index: 2, start: 0, section: 0, collapsed: true };
  const col = { name: '', comparison: 'Personal Best', type: 'SegmentDeltaorSegmentTime' as const };
  assert.deepEqual(subsplitValue(run, row, col, true, true), { value: 180, delta: false });
  s.timer.phase = TimerPhase.RUNNING; s.timer.splitIndex = 1; s.timer.realTimeTicks = ticks(181); applyBridgeSnapshot(run, s, 0);
  assert.deepEqual(subsplitValue(run, row, col, true, true), { value: 1, delta: true });
  assert.deepEqual(subsplitValue(run, row, col, false, true), { value: 180, delta: false });
  s.timer.phase = TimerPhase.ENDED; s.timer.splitIndex = 3;
  s.attempt.segments.push(attemptSegment(2, ticks(175), ticks(165)));
  applyBridgeSnapshot(run, s, 0);
  assert.deepEqual(subsplitValue(run, row, col, true, true), { value: -5, delta: true });
  assert.equal(subsplitValue(run, row, { ...col, type: 'SegmentTime' }, true, true).value, 175);
  assert.equal(subsplitValue(run, row, { ...col, timingMethod: 'Game Time' }, true, true).value, -5);
  // A skipped section boundary is unknown, not the most recent earlier actual.
  assert.equal(sectionTimes(run, { start: 2, end: 2 }, 'Personal Best').time, null);
  s.attemptFresh = false; applyBridgeSnapshot(run, s, 0);
  assert.equal(sectionTimes(run, { start: 0, end: 2 }, '').time, null);
});
test('DOM follows split, undo and reset; header clock updates without rebuilding names', async () => {
  const dom = new Window();
  Object.assign(globalThis, { HTMLElement: dom.HTMLElement, document: dom.document });
  try {
    const root = dom.document.createElement('livesplit-subsplits');
    root.innerHTML = '<table><thead><tr data-ls-field="split-head"></tr></thead><tbody data-ls-field="splits"></tbody></table>';
    root.setAttribute('settings', '{"ShowColumnLabels":true,"ShowBlankSplits":false}');
    const element = root as unknown as HTMLElement;
    const s = fixture(), run = new RunReadout();
    s.run.segments[0].name = '-<b>Road</b>'; s.run.segments[1].name = '{Stage}Boss'; s.run.segments[2].name = 'Final';
    s.timer.splitIndex = 0; applyBridgeSnapshot(run, s, 0); renderSplits(run, element);
    assert.equal(root.querySelectorAll('[data-section-header]').length, 1);
    assert.equal(root.querySelector('b'), null);
    const header = root.querySelector('[data-section-header]');
    assert.ok(header?.textContent?.includes('Stage'));
    assert.ok(root.querySelector('[data-split-index="0"]')?.classList.contains('active'));
    run.liveTime = '1:25.00'; updateLiveSplits(run, element);
    assert.equal(header?.querySelector('[data-section-clock]')?.textContent, '1:25.0');
    assert.equal(root.querySelector('[data-section-header]'), header);
    s.timer.splitIndex = 2; applyBridgeSnapshot(run, s, 0); renderSplits(run, element);
    assert.equal(root.querySelector('[data-section-header]'), null);
    assert.equal(root.querySelector('[data-split-index="1"]')?.getAttribute('data-collapsed'), 'true');
    s.timer.splitIndex = 0; applyBridgeSnapshot(run, s, 0); renderSplits(run, element);
    assert.ok(root.querySelector('[data-section-header]'));
    s.timer.phase = TimerPhase.NOT_RUNNING; s.timer.splitIndex = -1; applyBridgeSnapshot(run, s, 0); renderSplits(run, element);
    assert.equal(root.querySelector('.active'), null);
    assert.equal(root.querySelector('[data-section-clock]')?.textContent, '—');
    root.setAttribute('settings', '{"HideSubsplits":true,"ShowSubsplits":true}'); assert.throws(() => subsplitSettings(element));
  } finally { await dom.happyDOM.close(); }
});
