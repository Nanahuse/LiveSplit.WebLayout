import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { clockParts } from '../src/timer.ts';
import { fixture } from './bridge-fixture.ts';
import { readSnapshot } from './readout-fixture.ts';

test('declarative text and detailed timer views use native settings', async () => {
  const dom = new Window();
  Object.assign(globalThis, { document: dom.document });
  try {
    const { render } = await import('lit-html');
    const { detailedTimerView, textView } = await import('../src/layout-parts.ts');
    const s = fixture();
    s.context.customVariables['Death Count'] = '<img>';
    let { state } = readSnapshot(s);

    const text = dom.document.createElement('livesplit-text') as unknown as HTMLElement;
    text.setAttribute('settings', JSON.stringify({ Text1: 'Deaths', Text2: 'Death Count', CustomVariable: true, Display2Rows: true }));
    render(textView(text).view(state), text);
    assert.equal(text.dataset.twoRows, 'true');
    assert.equal(text.querySelector('[data-text-side="left"]')?.textContent, 'Deaths');
    assert.equal(text.querySelector('[data-text-side="right"]')?.textContent, '<img>');
    assert.equal(text.querySelector('img'), null);
    text.setAttribute('settings', JSON.stringify({ Text2: 'Fixed' }));
    text.setAttribute('left-field', 'game');
    render(textView(text).view(state), text);
    assert.equal(text.dataset.twoRows, 'false');
    assert.equal(text.querySelector('[data-text-side="left"]')?.textContent, 'Game');
    assert.equal(text.querySelector('[data-text-side="right"]')?.textContent, 'Fixed');

    const timer = dom.document.createElement('livesplit-detailed-timer') as unknown as HTMLElement;
    timer.style.setProperty('--ls-decimal-size', '.8em');
    render(detailedTimerView(timer, 'color')(state), timer);
    assert.ok(timer.querySelector('.ls-segment-name')?.hasAttribute('hidden'));
    assert.equal(timer.querySelector('dt')?.textContent, 'Personal Best');
    assert.equal(timer.querySelector('dd')?.textContent, '1:00.00');

    timer.setAttribute('settings', JSON.stringify({ ShowSplitName: true, HideComparison: true, Comparison: 'Average Segments', DecimalsSize: 50 }));
    render(detailedTimerView(timer, 'color')(state), timer);
    assert.equal(timer.querySelector('.ls-segment-name')?.hasAttribute('hidden'), false);
    assert.ok(timer.querySelector('dd')?.parentElement?.nextElementSibling?.hasAttribute('hidden'));
    assert.equal(timer.querySelector<HTMLElement>('.ls-detailed')?.style.getPropertyValue('--ls-setting-decimal-size'), '0.5em');
    assert.equal(timer.style.getPropertyValue('--ls-decimal-size'), '.8em');
    assert.equal(timer.querySelector('dt')?.textContent, 'Average Segments');
    assert.equal(timer.querySelector('dd')?.textContent, '—');
    timer.setAttribute('settings', '{"DisplayIcon":true}');
    assert.throws(() => detailedTimerView(timer, 'color'), /未対応/);

    s.timer.phase = 'ended';
    s.timer.splitIndex = 3;
    ({ state } = readSnapshot(s));
    timer.setAttribute('settings', '{"Comparison":"Personal Best"}');
    render(detailedTimerView(timer, 'color')(state), timer);
    assert.equal(timer.querySelector('dd')?.textContent, '1:00.00');
    timer.setAttribute('settings', JSON.stringify({ Comparison: 'bad\nname' }));
    assert.throws(() => detailedTimerView(timer, 'color'), /Invalid comparison/);
  } finally { await dom.happyDOM.close(); }
});

test('clock formatting supports minimum digits and independent precision without rounding ahead', () => {
  assert.deepEqual(clockParts(9.999, '1', '.23'), { whole: '9', fraction: '.99' });
  assert.deepEqual(clockParts(9.999, '1:23', '.2'), { whole: '0:09', fraction: '.9' });
  assert.deepEqual(clockParts(9.999, '1:23:45', ''), { whole: '0:00:09', fraction: '' });
  assert.deepEqual(clockParts(-3601.12, '1', '.23'), { whole: '-1:00:01', fraction: '.12' });
});
