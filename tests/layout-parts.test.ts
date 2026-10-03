import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { RunReadout } from '../src/readout.ts';
import { configureLayout, detailedComparisons, layoutTemplates, renderDetailed } from '../src/layout-parts.ts';
import { clockParts } from '../src/presentation-settings.ts';

test('native text settings bind custom variables and change back to fixed two-row text', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-text');
    root.innerHTML = layoutTemplates['livesplit-text'];
    root.setAttribute('settings', JSON.stringify({ Text1: 'Deaths', Text2: 'Death Count', CustomVariable: true, Display2Rows: true }));
    configureLayout(root as unknown as HTMLElement);
    assert.equal(root.dataset.twoRows, 'true');
    assert.equal(root.querySelector('[data-text-side="left"]')?.textContent, 'Deaths');
    assert.equal(root.querySelector('[data-text-side="right"]')?.getAttribute('data-ls-variable'), 'Death Count');
    root.setAttribute('settings', JSON.stringify({ Text2: 'Fixed' }));
    configureLayout(root as unknown as HTMLElement);
    assert.equal(root.dataset.twoRows, 'false');
    assert.equal(root.querySelector('[data-ls-variable]'), null);
    assert.equal(root.querySelector('[data-text-side="right"]')?.textContent, 'Fixed');
  } finally { await dom.happyDOM.close(); }
});

test('detailed timer uses current comparison and native visibility and size settings', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-detailed-timer');
    root.innerHTML = layoutTemplates['livesplit-detailed-timer'];
    const element = root as unknown as HTMLElement;
    configureLayout(element);
    assert.deepEqual(detailedComparisons(element), ['', 'Best Segments']);
    assert.ok(root.querySelector('.ls-segment-name')?.hasAttribute('hidden'));
    root.setAttribute('settings', JSON.stringify({ ShowSplitName: true, HideComparison: true, Comparison: 'Average Segments', DecimalsSize: 50 }));
    configureLayout(element);
    assert.equal(root.querySelector('.ls-segment-name')?.hasAttribute('hidden'), false);
    assert.ok(root.querySelector('[data-comparison-value="2"]')?.parentElement?.hasAttribute('hidden'));
    assert.equal(root.style.getPropertyValue('--ls-decimal-size'), '0.5em');
    assert.deepEqual(detailedComparisons(element), ['Average Segments', 'Best Segments']);
    root.setAttribute('settings', '{"DisplayIcon":true}');
    assert.throws(() => configureLayout(element), /未対応/);
  } finally { await dom.happyDOM.close(); }
});

test('clock formatting supports minimum digits and independent precision without rounding ahead', () => {
  assert.deepEqual(clockParts(9.999, '1', '.23'), { whole: '9', fraction: '.99' });
  assert.deepEqual(clockParts(9.999, '1:23', '.2'), { whole: '0:09', fraction: '.9' });
  assert.deepEqual(clockParts(9.999, '1:23:45', ''), { whole: '0:00:09', fraction: '' });
  assert.deepEqual(clockParts(-3601.12, '1', '.23'), { whole: '-1:00:01', fraction: '.12' });
});

test('detailed comparison times need a baseline and preserve segment references after finish', async () => {
  const dom = new Window();
  try {
    const root = dom.document.createElement('livesplit-detailed-timer');
    root.innerHTML = layoutTemplates['livesplit-detailed-timer'];
    root.setAttribute('comparison1', 'Personal Best');
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

