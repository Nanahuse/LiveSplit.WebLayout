import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { RunReadout } from '../src/readout.ts';
import { recordStates, renderRecordColors, validateRecordEffects } from '../src/record-colors.ts';

function fixture(phase = 'Ended') {
  const run = new RunReadout();
  run.liveTime = '1:29.00';
  run.comparisons.finalComparisonDelta = -11;
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
test('PB is a completed run against selected comparison; BS never flashes timers', () => {
  const run = fixture('Running');
  assert.equal(recordStates(run).pb, false);
  assert.ok(recordStates(run).best.has(1)); // 89 - 80 - 10 = -1
  assert.notEqual(recordStates(run).timer, 'pb');
  run.history.phase = run.comparisons.phase = 'Ended'; run.values.set('getcurrenttimerphase', 'Ended');
  assert.equal(recordStates(run).pb, true);
  run.history.rows.get(1)!.time = '00:01:40';
  run.comparisons.finalComparisonDelta = 0;
  assert.equal(recordStates(run).pb, false); // a tie is not a PB
  assert.equal(recordStates(run).best.size, 0);
});
test('missing comparisons and inconsistent snapshots cannot claim records; reset clears', () => {
  const run = fixture();
  run.comparisons.rows.clear(); run.comparisons.finalComparisonDelta = undefined;
  assert.equal(recordStates(run).pb, false);
  assert.equal(recordStates(run).best.size, 0);
  const crossed = fixture(); crossed.values.set('getsplitindex', '1');
  assert.equal(recordStates(crossed).pb, false);
  assert.equal(recordStates(crossed).best.size, 0);
  const reset = fixture(); recordStates(reset); reset.clear();
  assert.equal(recordStates(reset).timer, 'unknown');
});

test('native phase priority and selected comparison delta determine timer color', () => {
  const run = fixture();
  run.comparisons.finalComparisonDelta = null;
  assert.equal(recordStates(run).timer, 'pb'); // explicit missing comparison, first finish
  run.comparisons.finalComparisonDelta = 0;
  assert.equal(recordStates(run).timer, 'behind-losing');
  run.comparisons.finalComparisonDelta = 5; // faster than PB fixture, slower than selected comparison
  assert.equal(recordStates(run).timer, 'behind-losing');
  run.history.phase = run.comparisons.phase = 'Paused'; run.values.set('getcurrenttimerphase', 'Paused');
  assert.equal(recordStates(run).timer, 'paused');
  run.liveTime = '-0:01.00';
  assert.equal(recordStates(run).timer, 'not-running');
  run.liveTime = '1:29.00';
  run.history.phase = run.comparisons.phase = 'Running'; run.values.set('getcurrenttimerphase', 'Running');
  run.comparisons.rows.set(2, new Map([['', { target: 100, previousDelta: -20 }]]));
  assert.equal(recordStates(run).timer, 'ahead-losing');
  run.liveTime = '1:10.00'; assert.equal(recordStates(run).timer, 'ahead-gaining');
  run.comparisons.rows.get(2)!.get('')!.previousDelta = 20;
  run.liveTime = '1:50.00'; assert.equal(recordStates(run).timer, 'behind-gaining');
  run.liveTime = '2:10.00'; assert.equal(recordStates(run).timer, 'behind-losing');
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
    assert.equal(root.querySelector('.ls-segment-time')?.getAttribute('data-record'), 'pb');
    root.setAttribute('pb-effect', 'none'); renderRecordColors(fixture(), element, true);
    assert.equal(root.querySelector('.ls-segment-time')?.getAttribute('data-record-effect'), 'none');
    renderRecordColors(fixture(), element, false);
    assert.equal(root.querySelector('.ls-timer')?.getAttribute('data-record'), '');
    root.setAttribute('bs-effect', 'invalid'); assert.throws(() => validateRecordEffects(element));
  } finally { await dom.happyDOM.close(); }
});

test('field-only timer templates receive PB color without the default wrapper', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-timer');
    root.innerHTML = '<strong data-ls-field="whole">0:14</strong><small data-ls-field="fraction">.17</small>';
    const element = root as unknown as HTMLElement;
    const run = fixture();
    renderRecordColors(run, element, true);
    for (const child of root.children) {
      assert.equal(child.getAttribute('data-timer-color'), 'pb');
      assert.equal(child.getAttribute('data-record-effect'), 'color');
    }
    root.setAttribute('pb-effect', 'rainbow'); renderRecordColors(run, element, true);
    assert.equal(root.querySelector('strong')?.getAttribute('data-record-effect'), 'rainbow');
    run.comparisons.finalComparisonDelta = 0; renderRecordColors(run, element, true);
    assert.equal(root.querySelector('strong')?.getAttribute('data-timer-color'), 'behind-losing');
    assert.equal(root.querySelector('strong')?.getAttribute('data-record'), '');
  } finally { await dom.happyDOM.close(); }
});
