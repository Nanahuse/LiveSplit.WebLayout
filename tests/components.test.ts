import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

test('parts share connections, render independently, and release sockets when removed', async () => {
  const dom = new Window({ url: 'http://localhost/' });
  const sockets: FakeSocket[] = [];
  class FakeSocket {
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror = null; onclose = null; closed = false;
    constructor(readonly url: string) { sockets.push(this); }
    send() {}
    close() { this.closed = true; }
  }
  Object.assign(globalThis, { window: dom, document: dom.document, location: dom.location,
    HTMLElement: dom.HTMLElement, customElements: dom.customElements, WebSocket: FakeSocket });
  await import('../src/components.ts');
  const body = dom.document.body;
  try {
    body.innerHTML = '<h1>My layout</h1><livesplit-timer></livesplit-timer><livesplit-timer><b data-ls-field="time"></b></livesplit-timer><livesplit-value field="phase"></livesplit-value><livesplit-splits></livesplit-splits>';
    assert.equal(sockets.length, 1);
    sockets[0].onopen?.();
    sockets[0].onmessage?.({ data: '00:01:23.4500000' });
    assert.equal(sockets.length, 2); // one timer + one metadata connection, not per part
    assert.equal(body.querySelector('[data-ls-field="whole"]')?.textContent, '1:23');
    assert.equal(body.querySelector('b')?.textContent, '1:23.45');
    assert.equal(body.querySelector('h1')?.textContent, 'My layout');
    assert.equal(body.querySelectorAll('[id]').length, 0);
    body.querySelector('livesplit-timer')!.remove();
    assert.equal(sockets[0].closed, false);
    body.innerHTML = '';
    assert.ok(sockets.every(socket => socket.closed));
    body.innerHTML = '<livesplit-status server="https://invalid.example"></livesplit-status>';
    assert.equal(body.querySelector('livesplit-status')?.getAttribute('data-state'), 'error');
    assert.equal(sockets.length, 2);
  } finally { body.innerHTML = ''; await dom.happyDOM.close(); }
});
