import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { create } from '@bufbuild/protobuf';
import { metrics } from '../src/metrics.ts';
import { fixture, FakeBridgeSocket, flush, ticks } from './bridge-fixture.ts';
import { AttemptSegmentSchema, TimerPhase, BridgeEventType } from '../src/generated/livesplit/bridge/v3/common_pb.ts';

test('parts share binary Bridge connections, render full run and custom fields, then release sockets', async () => {
  const dom = new Window({ url: 'http://localhost/' });
  const sockets: FakeBridgeSocket[] = []; const data = fixture();
  class Socket extends FakeBridgeSocket {
    constructor(url: string) { super(url); sockets.push(this); queueMicrotask(() => this.onopen?.()); }
    override send(bytes: Uint8Array) { super.send(bytes); queueMicrotask(() => this.answer(data)); }
  }
  Object.assign(globalThis, { window: dom, document: dom.document, location: dom.location, HTMLElement: dom.HTMLElement, customElements: dom.customElements, WebSocket: Socket });
  await import('../src/components.ts');
  const body = dom.document.body;
  try {
    body.innerHTML = '<livesplit-text left="&lt;b&gt;text&lt;/b&gt;"></livesplit-text>';
    assert.equal(sockets.length, 0); assert.equal(body.querySelector('b'), null);
    body.innerHTML = '<livesplit-timer></livesplit-timer><livesplit-timer><strong data-ls-field="whole"></strong><small data-ls-field="fraction"></small></livesplit-timer><livesplit-splits></livesplit-splits><livesplit-detailed-timer></livesplit-detailed-timer><livesplit-text right-variable="Deaths"></livesplit-text>';
    for (const tag of Object.keys(metrics)) body.appendChild(dom.document.createElement(tag));
    await flush(); await flush();
    assert.equal(sockets.length, 2);
    assert.ok(sockets[0].url.endsWith('/events')); assert.ok(sockets[1].url.endsWith('/rpc'));
    assert.equal(body.querySelector('strong')?.textContent, '1:23');
    const text = (tag: string) => body.querySelector(`${tag} .ls-value`)?.textContent;
    assert.equal(text('livesplit-best-possible-time'), '2:39.00');
    assert.equal(text('livesplit-current-pace'), '2:59.00');
    assert.equal(text('livesplit-sum-of-best'), '2:30.00');
    assert.equal(text('livesplit-completed-attempts'), '12');
    assert.equal(text('livesplit-hotkey-indicator'), '取得不可');
    assert.equal(body.querySelector('[data-ls-variable]')?.textContent, '<b>42</b>');
    assert.equal(body.querySelector('[data-ls-variable] b'), null);
    assert.equal(body.querySelector('[data-comparison-value="1"]')?.textContent, '1:00.00');
    const splits = body.querySelector('livesplit-splits')!;
    assert.equal(splits.querySelector('[data-split-index="2"] td:last-child')?.textContent, '3:00');
    splits.setAttribute('columns', JSON.stringify([{ Type: 'Split Time', TimingMethod: 'Game Time', Name: '<GT>', Width: '7ch' }]));
    assert.equal(splits.querySelector('[data-split-index="2"] td')?.textContent, '2:50');
    assert.equal(splits.querySelectorAll('colgroup col')[1].getAttribute('style'), 'width: 7ch;');
    assert.equal(splits.querySelector('gt'), null);
    const best = body.querySelector('livesplit-best-possible-time')!;
    best.setAttribute('label', '<b>Best</b>'); best.setAttribute('hide-label', '');
    assert.equal(best.querySelector('.ls-label')?.textContent, '<b>Best</b>');
    assert.equal(best.querySelector('b'), null);
    data.timer.phase = TimerPhase.ENDED; data.timer.splitIndex = 3; data.timer.realTimeTicks = ticks(170);
    data.attempt.segments.push(create(AttemptSegmentSchema, { index: 2, splitTime: { realTimeTicks: ticks(170) } }));
    sockets[0].event(data, 500n); await flush(); await flush();
    assert.equal(body.querySelector('strong')?.getAttribute('data-record'), 'pb');
    assert.equal(body.querySelector('.ls-timer')?.getAttribute('data-record'), 'pb');
    data.timer.phase = TimerPhase.NOT_RUNNING; data.timer.splitIndex = -1; data.timer.realTimeTicks = 0n;
    // Individual bests must not be reconstructed from cumulative Best Segments.
    data.run.segments[0].bestSegmentTime!.realTimeTicks = ticks(40);
    data.run.segments[2].bestSegmentTime!.realTimeTicks = ticks(35);
    sockets[0].event(data, 501n, BridgeEventType.EVENT_RUN_CHANGED); await flush(); await flush();
    assert.equal(body.querySelector('[data-comparison-value="1"]')?.textContent, '1:00.00');
    assert.equal(body.querySelector('[data-comparison-value="2"]')?.textContent, '0:40.00');
    assert.equal(text('livesplit-current-split'), 'First');
    assert.equal(text('livesplit-comparison-time'), '1:00.00');
    splits.setAttribute('columns', JSON.stringify([{ Type: 'Segment Time', Comparison: 'Best Segments' }]));
    assert.equal(splits.querySelector('[data-split-index="2"] td')?.textContent, '0:35');
    data.run.segments[2].bestSegmentTime!.realTimeTicks = ticks(34);
    sockets[0].event(data, 502n, BridgeEventType.EVENT_RUN_CHANGED); await flush(); await flush();
    assert.equal(splits.querySelector('[data-split-index="2"] td')?.textContent, '0:34');
    data.run.segments[0].bestSegmentTime = undefined;
    sockets[0].event(data, 503n, BridgeEventType.EVENT_RUN_CHANGED); await flush(); await flush();
    assert.equal(body.querySelector('[data-comparison-value="2"]')?.textContent, '—');
    assert.equal(sockets.length, 2);
    body.innerHTML = ''; assert.ok(sockets.every(s => s.closed));
    body.innerHTML = '<livesplit-status server="ws://localhost:16834/livesplit"></livesplit-status>';
    assert.equal(body.querySelector('livesplit-status')?.getAttribute('data-state'), 'error');
  } finally { body.innerHTML = ''; await dom.happyDOM.close(); }
});
