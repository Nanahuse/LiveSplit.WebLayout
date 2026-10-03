import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunReadout, displayTime, splitSummary } from '../src/readout.ts';

test('master metadata populates the full split list before starting the timer', () => {
  const run = new RunReadout();
  run.receive('getgamename', 'Celeste');
  run.receive('getcategoryname', 'Any%');
  run.receive('getcurrenttimerphase', 'NotRunning');
  run.receive('getsplitindex', '-1');
  run.receive('getsplitcount', '2');
  run.receive('getsplitname 0', 'Forsaken City');
  run.receive('getsplitname 1', 'Old Site');
  assert.equal(run.values.get('getgamename'), 'Celeste');
  assert.equal(run.values.get('getcategoryname'), 'Any%');
  assert.deepEqual([...run.names.values()], ['Forsaken City', 'Old Site']);
  assert.equal(splitSummary(run).progress, '0 / 2 区間終了');
  assert.match(splitSummary(run).note, /計測開始前の区間一覧/);
  assert.equal(run.unavailable.size, 0);
});

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
  const seen = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const command = run.nextCommand(); seen.add(command);
    run.receive(command, command === 'getsplitcount' ? '2' : '-');
  }
  assert.ok(seen.has('getsplitname 0'));
  assert.ok(seen.has('getsplitname 1'));
  run.receive('getsplitname 0', 'First');
  run.receive('getsplitname 1', 'Last');
  run.receive('getsplitcount', '1');
  assert.deepEqual([...run.names], [[0, 'First']]);
  run.clear();
  assert.equal(run.count, 0);
  assert.equal(run.names.size, 0);
});

test('fast snapshots run every 100ms while static metadata has independent deadlines', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 10000 });
  const run = new RunReadout();
  run.comparisons.names = new Set(['Personal Best', 'Best Segments']);
  run.receive('getsplitcount', '1000');
  const reads = new Map<string, number[]>();
  for (let cycle = 0; cycle < 70; cycle++) {
    let requests = 0;
    do {
      const command = run.nextCommand();
      reads.set(command, [...reads.get(command) ?? [], Date.now()]);
      run.receive(command, command === 'getsplitcount' ? '1000' : '-');
      requests++;
    } while (run.nextDelay() === 0);
    assert.ok(requests <= 26, 'a large split list must not delay the next snapshot');
    t.mock.timers.tick(run.nextDelay());
  }
  const phases = [...new Set(reads.get('getcurrenttimerphase'))];
  assert.equal(phases.length, 70);
  for (let i = 1; i < phases.length; i++) assert.equal(phases[i] - phases[i - 1], 100);
  assert.equal(reads.get('getgamename')?.length, 2);
  assert.ok(reads.has('getsplitname 10'));
});

test('metadata refreshes periodically and reconnect clears all deadlines', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 10000 });
  const run = new RunReadout();
  const reads = new Map<string, number[]>();
  for (let cycle = 0; cycle < 120; cycle++) {
    do {
      const command = run.nextCommand();
      reads.set(command, [...reads.get(command) ?? [], Date.now()]);
      run.receive(command, '-');
    } while (run.nextDelay() === 0);
    t.mock.timers.tick(run.nextDelay());
  }
  const games = reads.get('getgamename')!;
  assert.equal(games.length, 3);
  assert.ok(games[1] - games[0] >= 5000);
  assert.ok(reads.get('getattemptcount')!.length >= 10);
  run.clear();
  const commands = [];
  do { const command = run.nextCommand(); commands.push(command); run.receive(command, '-'); } while (run.nextDelay() === 0);
  assert.ok(commands.includes('getgamename'));
});

test('null timeouts clear stale values and back off unsupported commands', () => {
  const run = new RunReadout();
  run.receive('getgamename', 'Game');
  run.receive('getgamename', null);
  assert.equal(run.values.has('getgamename'), false);
  assert.ok(run.unavailable.has('getgamename'));
  for (let i = 0; i < 40; i++) {
    const command = run.nextCommand();
    assert.notEqual(command, 'getgamename');
    run.receive(command, '-');
  }
  run.receive('getgamename', 'New Game');
  assert.equal(run.unavailable.has('getgamename'), false);
  run.receive('getdelta', '-');
  assert.equal(run.unavailable.has('getdelta'), false);
});
