import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { RunReadout } from '../src/readout.ts';
import { configureLayout, detailedComparisons, layoutTemplates, renderDetailed } from '../src/layout-parts.ts';

test('detailed comparison times need a baseline and preserve segment references after finish', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-detailed-timer');
    root.innerHTML = layoutTemplates['livesplit-detailed-timer'];
    const element = root as unknown as HTMLElement;
    const run = new RunReadout();
    run.history.phase = 'Running'; run.history.index = 2;
    run.comparisons.rows.set(2, new Map([['Personal Best', { target: 100, previousDelta: null }]]));
    renderDetailed(run, element);
    assert.equal(root.querySelector('[data-comparison-value="1"]')?.textContent, '—');
    run.comparisons.rows.set(1, new Map([['Personal Best', { target: 70, previousDelta: 0 }]]));
    renderDetailed(run, element);
    assert.equal(root.querySelector('[data-comparison-value="1"]')?.textContent, '0:30.00');
    run.history.phase = 'Ended'; run.history.index = 3;
    renderDetailed(run, element);
    assert.equal(root.querySelector('[data-comparison-value="1"]')?.textContent, '0:30.00');
    root.setAttribute('comparison1', 'Current Comparison');
    assert.deepEqual(detailedComparisons(element), ['', 'Best Segments']);
    root.setAttribute('comparison1', 'bad\ncommand');
    assert.throws(() => detailedComparisons(element));
  } finally { await dom.happyDOM.close(); }
});

test('text can switch from fields back to literals', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-text');
    root.innerHTML = layoutTemplates['livesplit-text'];
    root.setAttribute('left-field', 'game');
    configureLayout(root as unknown as HTMLElement);
    assert.equal(root.querySelector('[data-text-side="left"]')?.getAttribute('data-ls-field'), 'game');
    root.removeAttribute('left-field'); root.setAttribute('left', '<img>');
    configureLayout(root as unknown as HTMLElement);
    assert.equal(root.querySelector('[data-text-side="left"]')?.textContent, '<img>');
    assert.equal(root.querySelector('[data-ls-field]'), null);
    assert.equal(root.querySelector('img'), null);
  } finally { await dom.happyDOM.close(); }
});
