import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { RunReadout } from '../src/readout.ts';
import { recordStates, renderRecordColors, validateRecordEffects } from '../src/record-colors.ts';

function fixture(phase = 'Ended') {
  const run = new RunReadout();
  run.history.index = run.comparisons.index = 2;
  run.history.phase = run.comparisons.phase = phase;
  run.values.set('getcurrenttimerphase', phase); run.values.set('getsplitindex', '2');
  run.history.rows.set(1, { index: 1, time: '00:01:29' });
  run.comparisons.rows.set(1, new Map([
    ['Personal Best', { target: 100, previousDelta: 0 }],
    ['Best Segments', { target: 80, previousDelta: 10, previousTime: 60 }],
  ]));
  return run;
}
test('PB is a completed run; BS removes prior losses and flash expires', () => {
  const run = fixture('Running');
  assert.equal(recordStates(run, 0).pb, false);
  assert.ok(recordStates(run, 0).best.has(1)); // 89 - 80 - 10 = -1
  assert.equal(recordStates(run, 1999).flash, true);
  assert.equal(recordStates(run, 2000).flash, false);
  run.history.phase = run.comparisons.phase = 'Ended'; run.values.set('getcurrenttimerphase', 'Ended');
  assert.equal(recordStates(run).pb, true);
  run.history.rows.get(1)!.time = '00:01:40';
  assert.equal(recordStates(run).pb, false); // a tie is not a PB
  assert.equal(recordStates(run).best.size, 0);
});
test('missing comparisons and inconsistent snapshots cannot claim records; reset clears', () => {
  const run = fixture();
  run.comparisons.rows.clear();
  assert.equal(recordStates(run).pb, false);
  assert.equal(recordStates(run).best.size, 0);
  const crossed = fixture(); crossed.values.set('getsplitindex', '1');
  assert.equal(recordStates(crossed).pb, false);
  assert.equal(recordStates(crossed).best.size, 0);
  const reset = fixture(); recordStates(reset); reset.clear();
  assert.equal(recordStates(reset).flash, false);
});
test('PB and BS effects are independent and disconnected values lose their effects', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('div');
    root.innerHTML = '<span class="ls-timer"></span><span class="ls-segment-time"></span>';
    root.setAttribute('pb-effect', 'rainbow'); root.setAttribute('bs-effect', 'color');
    const element = root as unknown as HTMLElement;
    renderRecordColors(fixture(), element, true);
    assert.equal(root.querySelector('.ls-timer')?.getAttribute('data-record-effect'), 'rainbow');
    assert.equal(root.querySelector('.ls-segment-time')?.getAttribute('data-record'), 'bs');
    root.setAttribute('bs-effect', 'none'); renderRecordColors(fixture(), element, true);
    assert.equal(root.querySelector('.ls-segment-time')?.getAttribute('data-record-effect'), 'none');
    renderRecordColors(fixture(), element, false);
    assert.equal(root.querySelector('.ls-timer')?.getAttribute('data-record'), '');
    root.setAttribute('bs-effect', 'invalid'); assert.throws(() => validateRecordEffects(element));
  } finally { await dom.happyDOM.close(); }
});
