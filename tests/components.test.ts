import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { metrics } from '../src/metrics.ts';

test('parts share connections, render independently, and release sockets when removed', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const dom = new Window({ url: 'http://localhost/' });
  const sockets: FakeSocket[] = [];
  class FakeSocket {
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror = null; onclose = null; closed = false;
    constructor(readonly url: string) { sockets.push(this); }
    command = '';
    send(command: string) { this.command = command; }
    close() { this.closed = true; }
  }
  Object.assign(globalThis, { window: dom, document: dom.document, location: dom.location,
    HTMLElement: dom.HTMLElement, customElements: dom.customElements, WebSocket: FakeSocket });
  await import('../src/components.ts');
  const body = dom.document.body;
  try {
    body.innerHTML = '<livesplit-text left="&lt;b&gt;text&lt;/b&gt;" right="static"></livesplit-text>';
    assert.equal(sockets.length, 0);
    assert.equal(body.querySelector('[data-text-side="left"]')?.textContent, '<b>text</b>');
    assert.equal(body.querySelector('b'), null);
    body.innerHTML = '<h1>My layout</h1><livesplit-timer></livesplit-timer><livesplit-timer><b data-ls-field="time"></b></livesplit-timer><livesplit-value field="phase"></livesplit-value><livesplit-splits></livesplit-splits>';
    assert.equal(sockets.length, 1);
    const initialSplits = body.querySelector('livesplit-splits')!;
    assert.deepEqual([...initialSplits.querySelectorAll('thead th')].map(th => th.textContent), ['区間', '+/-', 'Time']);
    assert.ok(initialSplits.querySelector('thead tr')?.hasAttribute('hidden'));
    sockets[0].onopen?.();
    sockets[0].onmessage?.({ data: '00:01:23.4500000' });
    assert.equal(sockets.length, 2); // one timer + one metadata connection, not per part
    assert.equal(body.querySelector('[data-ls-field="whole"]')?.textContent, '1:23');
    assert.equal(body.querySelector('b')?.textContent, '1:23.45');
    assert.equal(body.querySelector('h1')?.textContent, 'My layout');
    assert.equal(body.querySelectorAll('[id]').length, 0);
    for (const tag of Object.keys(metrics)) body.appendChild(dom.document.createElement(tag));
    for (const tag of ['livesplit-detailed-timer', 'livesplit-text']) body.appendChild(dom.document.createElement(tag));
    body.querySelector('livesplit-detailed-timer')!.setAttribute('comparison1', 'Personal Best');
    body.querySelector('livesplit-text')!.setAttribute('right-field', 'time');
    const customText = dom.document.createElement('livesplit-text');
    customText.setAttribute('right-variable', 'My Counter'); body.appendChild(customText);
    const responses: Record<string, string> = {
      getcurrenttimerphase: 'Running', getsplitindex: '1', getcurrentsplitname: 'Second',
      getprevioussplitname: 'First', getcomparisonsplittime: '00:02:00', getlastsplittime: '00:00:59',
      getdelta: '-00:00:01.25', getbestpossibletime: '00:05:45.1234567', getfinaltime: '00:06:00',
      getgamename: 'Game', getcategoryname: 'Any%', gettimingmethod: 'RealTime',
      getcomparisonname: 'Personal Best', getattemptcount: '42', getcompletedcount: '12', getsplitcount: '0',
      'getcomparisonsplittime Personal Best': '00:02:00', 'getdelta Personal Best': '-00:00:01',
      'getcomparisonsplittime Best Segments': '00:01:20', 'getdelta Best Segments': '00:00:10',
      'getfinaltime Best Segments': '00:04:30', getpredictedtime: '00:05:58.75',
      getcurrentrealtime: '00:01:23.45', getcurrentgametime: '00:01:20.25',
      globalhotkeysenabled: 'True', 'getcustomvariablevalue My Counter': '<b>42</b>',
    };
    sockets[1].onopen?.();
    for (let i = 0; i < 400; i++) {
      sockets[0].onmessage?.({ data: '00:01:23.45' });
      sockets[1].onmessage?.({ data: responses[sockets[1].command] ?? '-' });
      t.mock.timers.tick(33);
    }
    const text = (tag: string) => body.querySelector(`${tag} .ls-value`)?.textContent;
    assert.equal(text('livesplit-best-possible-time'), '5:45.12');
    assert.equal(text('livesplit-delta'), '-0:01.25');
    assert.equal(body.querySelector('livesplit-delta .ls-value')?.getAttribute('data-sign'), 'ahead');
    assert.equal(text('livesplit-previous-split'), '0:59.00');
    assert.equal(text('livesplit-comparison-time'), '2:00.00');
    assert.equal(text('livesplit-final-time'), '6:00.00');
    assert.equal(text('livesplit-current-split'), 'Second');
    assert.equal(text('livesplit-previous-split-name'), 'First');
    assert.equal(text('livesplit-split-progress'), '第 2 区間');
    assert.equal(text('livesplit-attempts'), '42');
    assert.equal(text('livesplit-completed-attempts'), '12');
    assert.equal(text('livesplit-phase'), '計測中');
    assert.equal(text('livesplit-comparison'), 'Personal Best');
    assert.equal(text('livesplit-timing-method'), 'Real Time');
    assert.equal(text('livesplit-segment-timer'), '0:24.45');
    assert.equal(text('livesplit-previous-segment'), '0:59.00');
    assert.equal(text('livesplit-live-segment'), '—');
    assert.equal(text('livesplit-current-pace'), '5:58.75');
    assert.equal(text('livesplit-sum-of-best'), '4:30.00');
    assert.equal(text('livesplit-real-time'), '1:23.45');
    assert.equal(text('livesplit-game-time'), '1:20.25');
    assert.equal(text('livesplit-hotkey-indicator'), '有効');
    assert.equal(body.querySelector('.ls-hotkey-bar')?.getAttribute('data-hotkeys'), 'on');
    assert.equal(customText.querySelector('[data-ls-variable]')?.textContent, '<b>42</b>');
    assert.equal(customText.querySelector('b'), null);
    assert.equal(body.querySelector('livesplit-text [data-text-side="right"]')?.textContent, '1:23.45');
    assert.equal(body.querySelector('livesplit-detailed-timer .ls-segment-time')?.textContent, '24.45');
    assert.equal(body.querySelector('[data-comparison-value="1"]')?.textContent, '1:00.00');
    assert.equal(body.querySelector('[data-comparison-value="2"]')?.textContent, '0:31.00');
    assert.equal(sockets.length, 2);
    const splits = body.querySelector('livesplit-splits')!;
    splits.setAttribute('comparisons', 'Personal Best|Best Segments');
    for (let i = 0; i < 400; i++) {
      sockets[0].onmessage?.({ data: '00:01:23.45' });
      sockets[1].onmessage?.({ data: responses[sockets[1].command] ?? '-' });
      t.mock.timers.tick(33);
    }
    assert.equal(splits.querySelectorAll('thead th').length, 6);
    assert.equal(splits.querySelectorAll('tbody tr').length, 8);
    assert.equal(splits.querySelector('tbody tr:last-child')?.getAttribute('data-split-index'), '1');
    assert.equal(splits.querySelector('.split-blank')?.textContent, '\u00a0');
    splits.setAttribute('settings', JSON.stringify({ ShowColumnLabels: true, ShowBlankSplits: false, Display2Rows: true }));
    assert.equal(splits.querySelectorAll('tbody tr').length, 2);
    assert.equal(splits.querySelector('thead tr')?.hasAttribute('hidden'), false);
    assert.equal(splits.getAttribute('data-two-rows'), 'true');
    const delta = () => splits.querySelector('.active [data-column="delta"][data-comparison="Personal Best"]')?.textContent;
    assert.equal(delta(), '');
    sockets[0].onmessage?.({ data: '00:01:31' });
    assert.equal(delta(), '-29.0');
    const bestDelta = () => splits.querySelector('.active [data-column-type="SegmentDelta"]')?.textContent;
    assert.equal(bestDelta(), '+1.0');
    assert.equal(text('livesplit-segment-timer'), '0:32.00');
    assert.equal(text('livesplit-live-segment'), '-0:27.75');
    t.mock.timers.tick(33);
    sockets[0].onmessage?.({ data: '00:01:32' });
    assert.equal(delta(), '-28.0');
    assert.equal(bestDelta(), '+2.0');
    splits.setAttribute('columns', JSON.stringify([
      { type: 'SegmentDelta', comparison: 'Best Segments', name: '<Best>', width: '7ch' },
      { type: 'DeltaorSplitTime', comparison: 'Personal Best', name: 'PB' },
    ]));
    assert.equal(splits.querySelectorAll('thead th').length, 3);
    assert.equal(splits.querySelectorAll('thead th')[1].textContent, '<Best>');
    assert.equal(splits.querySelector('best'), null);
    assert.equal(splits.querySelectorAll('colgroup col').length, 3);
    assert.equal(splits.querySelectorAll('colgroup col')[1].getAttribute('style'), 'width: 7ch;');
    assert.equal(splits.querySelector('[data-column-index="0"]')?.getAttribute('style'), '--ls-cell-width: 7ch;');
    assert.equal(bestDelta(), '+2.0');
    splits.removeAttribute('columns');
    assert.equal(splits.querySelectorAll('colgroup col').length, 6);
    assert.ok(!splits.querySelector('[data-column-index="0"]')?.hasAttribute('style'));
    splits.setAttribute('live-delta', 'false');
    assert.equal(delta(), '');
    assert.equal(sockets.length, 2);
    const best = body.querySelector('livesplit-best-possible-time')!;
    best.setAttribute('label', '<b>最速予測</b>');
    assert.equal(best.querySelector('.ls-label')?.textContent, '<b>最速予測</b>');
    assert.equal(best.querySelector('b'), null);
    best.setAttribute('hide-label', '');
    assert.equal(best.querySelector('.ls-label')?.hasAttribute('hidden'), true);
    best.removeAttribute('label');
    assert.equal(best.querySelector('.ls-label')?.textContent, 'Best Possible Time');
    assert.equal(sockets.length, 2); // label changes must not reset shared history
    responses.getbestpossibletime = '-'; responses.getcurrenttimerphase = 'Ended';
    responses.getsplitindex = '2'; responses.getlastsplittime = '00:01:32';
    responses['getfinaltime Best Segments'] = '00:01:32';
    responses.getdelta = '00:00:02';
    responses.globalhotkeysenabled = 'False';
    for (let i = 0; i < 400; i++) {
      sockets[0].onmessage?.({ data: '00:01:23.45' });
      sockets[1].onmessage?.({ data: responses[sockets[1].command] ?? '-' });
      t.mock.timers.tick(33);
    }
    assert.equal(text('livesplit-best-possible-time'), '—');
    assert.equal(body.querySelector('.ls-hotkey-bar')?.getAttribute('data-hotkeys'), 'off');
    assert.equal(text('livesplit-sum-of-best'), '4:30.00');
    assert.equal(text('livesplit-segment-timer'), '0:33.00');
    assert.equal(text('livesplit-previous-segment'), '0:33.00');
    assert.equal(text('livesplit-live-segment'), '—');
    assert.equal(body.querySelector('livesplit-final-time .ls-label')?.textContent, '完走タイム');
    assert.equal(body.querySelector('livesplit-delta .ls-value')?.getAttribute('data-sign'), 'behind');
    assert.equal(splits.querySelector('[data-split-index="1"] [data-column-type="SegmentDelta"]')?.textContent, '+2.0');
    body.querySelector('livesplit-timer')!.remove();
    assert.equal(sockets[0].closed, false);
    body.innerHTML = '';
    assert.ok(sockets.every(socket => socket.closed));
    body.innerHTML = '<livesplit-status server="https://invalid.example"></livesplit-status>';
    assert.equal(body.querySelector('livesplit-status')?.getAttribute('data-state'), 'error');
    assert.equal(sockets.length, 2);
  } finally { body.innerHTML = ''; await dom.happyDOM.close(); }
});
