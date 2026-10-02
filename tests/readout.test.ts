import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunReadout, displayTime, splitSummary } from '../src/readout.ts';

test('legacy servers show current and previous splits without a total count', () => {
  const run = new RunReadout();
  run.receive('getsplitcount', null);
  run.receive('getcurrenttimerphase', 'NotRunning');
  run.receive('getsplitindex', '-1');
  assert.equal(splitSummary(run).current, '開始待ち');
  assert.match(splitSummary(run).note, /全区間一覧はこのサーバーから取得できません/);
  for (const phase of ['Running', 'Paused']) {
    run.receive('getcurrenttimerphase', phase);
    run.receive('getsplitindex', '1');
    run.receive('getcurrentsplitname', 'Second');
    run.receive('getprevioussplitname', 'First');
    assert.equal(splitSummary(run).current, 'Second');
    assert.equal(splitSummary(run).previous, 'First');
    assert.equal(splitSummary(run).progress, '第 2 区間');
  }
  run.receive('getcurrenttimerphase', 'Ended');
  assert.equal(splitSummary(run).progress, '完走');
  run.receive('getcurrenttimerphase', 'NotRunning');
  assert.equal(splitSummary(run).previous, '—');
});

test('handles absent times and signed deltas without displaying false zeroes', () => {
  assert.equal(displayTime('-'), '—');
  assert.equal(displayTime(undefined), '—');
  assert.equal(displayTime('-00:00:01.2345678', true), '-0:01.23');
  assert.equal(displayTime('00:00:01.2345678', true), '+0:01.23');
});

test('refreshes indexed split names and removes rows after the run shrinks', () => {
  const run = new RunReadout();
  run.receive('getsplitcount', '2');
  assert.equal(run.nextCommand(), 'getcurrenttimerphase');
  assert.equal(run.nextCommand(), 'getsplitname 0');
  run.nextCommand();
  assert.equal(run.nextCommand(), 'getsplitname 1');
  run.receive('getsplitname 0', 'First');
  run.receive('getsplitname 1', 'Last');
  run.receive('getsplitcount', '1');
  assert.deepEqual([...run.names], [[0, 'First']]);
  run.clear();
  assert.equal(run.count, 0);
  assert.equal(run.names.size, 0);
});

test('null timeouts clear stale values and back off unsupported commands', () => {
  const run = new RunReadout();
  run.receive('getgamename', 'Game');
  run.receive('getgamename', null);
  assert.equal(run.values.has('getgamename'), false);
  assert.ok(run.unavailable.has('getgamename'));
  for (let i = 0; i < 40; i++) assert.notEqual(run.nextCommand(), 'getgamename');
  run.receive('getgamename', 'New Game');
  assert.equal(run.unavailable.has('getgamename'), false);
  run.receive('getdelta', '-');
  assert.equal(run.unavailable.has('getdelta'), false);
});
