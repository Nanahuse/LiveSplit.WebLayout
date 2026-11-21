import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSettings, splitNumber, splitDefaults } from '../src/split-settings.ts';
import { columnsFor, columnValue } from '../src/columns.ts';
import { fixture, ticks } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';
const root = (settings = {}) => ({ getAttribute: (name: string) => name === 'settings' ? JSON.stringify(settings) : null, hasAttribute: () => false }) as unknown as Element;

test('native defaults and column labels match the official configuration', () => {
  assert.deepEqual(columnsFor(undefined).map(c => [c.name, c.type, c.comparison]), [['+/-', 'Delta', ''], ['Time', 'SplitTime', '']]);
  assert.deepEqual(splitSettings(root()), splitDefaults);
  const c = columnsFor([{ Name: 'Best', Type: 'Segment Delta or Segment Time', Comparison: 'Best Segments', TimingMethod: 'Real Time' }])[0];
  assert.equal(c.type, 'SegmentDeltaorSegmentTime'); assert.equal(c.comparison, 'Best Segments'); assert.equal(c.timingMethod, 'Real Time');
  assert.equal(columnsFor([{ Type: 'Segment Time', Comparison: 'Best Split Times' }])[0].comparison, '');
});
test('accuracy truncates, drops long delta fractions, and omits plus for zero', () => {
  assert.equal(splitNumber(12.999, false, splitDefaults), '0:12');
  assert.equal(splitNumber(1.299, true, splitDefaults), '+1.2');
  assert.equal(splitNumber(61.29, true, splitDefaults), '+1:01');
  assert.equal(splitNumber(0, true, splitDefaults), '0.0');
  assert.equal(splitNumber(-1.2349, true, { ...splitDefaults, DeltasAccuracy: 'Milliseconds' }), '-1.234');
  assert.equal(splitNumber(61.29, true, { ...splitDefaults, DropDecimals: false }), '+1:01.2');
});
test('unsupported timing data is never replaced by a different timing method', () => {
  const s = fixture();
  s.run.segments[0].comparisons[0].time = { realTimeTicks: ticks(100) };
  s.timer.phase = 'not_running';
  const { model: run } = readSnapshot(s);
  const column = columnsFor([{ Type: 'Split Time', TimingMethod: 'Game Time' }])[0];
  assert.equal(columnValue(run, 0, column, true).value, null);
  column.timingMethod = 'Real Time'; assert.equal(columnValue(run, 0, column, true).value, 100);
});
test('invalid settings are rejected and upcoming count leaves room for current and last rows', () => {
  assert.throws(() => splitSettings(root({ VisualSplitCount: -1 })));
  assert.throws(() => splitSettings(root({ SplitTimesAccuracy: 'Unknown' })));
  assert.throws(() => splitSettings(root({ ShowBlankSplits: 'false' })));
  assert.equal(splitSettings(root({ VisualSplitCount: 3, SplitPreviewCount: 20 })).SplitPreviewCount, 1);
});
