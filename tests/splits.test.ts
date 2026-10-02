import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SplitHistory, splitCommands, splitDelta } from '../src/splits.ts';

function sample(history: SplitHistory, phase: string, index: number, name: string, previous: string, target: string, time: string, end = index, endPhase = phase) {
  const values = [phase, String(index), name, previous, target, time, String(end), endPhase];
  splitCommands.forEach((command, i) => history.receive(command, values[i]));
}

test('captures cumulative results and comparison differences through finish', () => {
  const h = new SplitHistory();
  sample(h, 'Running', 0, 'First', '-', '00:01:00', '-');
  sample(h, 'Running', 1, 'Second', 'First', '00:02:00', '00:00:58.5');
  assert.equal(h.rows.get(0)?.time, '00:00:58.5');
  assert.equal(splitDelta(h.rows.get(0)!), '-0:01.50');
  sample(h, 'Ended', 2, '-', 'Second', '-', '00:02:03');
  assert.equal(splitDelta(h.rows.get(1)!), '+0:03.00');
  assert.equal(h.rows.size, 2);
});

test('discards samples crossing a split or phase change', () => {
  const h = new SplitHistory();
  sample(h, 'Running', 0, 'Wrong', '-', '00:01:00', '-', 1);
  assert.equal(h.rows.size, 0);
  sample(h, 'Running', 0, 'Wrong', '-', '00:01:00', '-', 0, 'NotRunning');
  assert.equal(h.rows.size, 0);
});

test('undo and reset remove obsolete results; missing history stays unknown', () => {
  const h = new SplitHistory();
  sample(h, 'Running', 3, 'Fourth', 'Third', '00:04:00', '00:03:00');
  assert.equal(h.rows.has(0), false);
  assert.equal(splitDelta(h.rows.get(2)!), undefined);
  sample(h, 'Paused', 2, 'Third', 'Second', '00:03:10', '-');
  assert.equal(h.rows.has(3), false);
  assert.equal(h.rows.get(2)?.time, undefined);
  assert.equal(h.rows.get(1)?.time, undefined);
  sample(h, 'NotRunning', -1, '-', '-', '-', '-');
  assert.equal(h.rows.size, 0);
});
