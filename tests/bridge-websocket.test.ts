import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer, WebSocket } from 'ws';
import { BridgeClient } from '../src/bridge-client.ts';
import type { BridgeSocket } from '../src/bridge-client.ts';
import { fixture, respond } from './bridge-fixture.ts';

test('v4 text frames synchronize from local-file origin and reconnect over real WebSockets', { timeout: 10000 }, async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object');
  const sockets: WebSocket[] = []; const paths: string[] = []; const methods = new Set<string>();
  server.on('connection', (socket, request) => {
    assert.equal(request.headers.origin, 'null'); paths.push(request.url!);
    if (request.url === '/bridge/v4/rpc') socket.on('message', (data, isBinary) => {
      assert.equal(isBinary, false);
      const text = data.toString(); methods.add(JSON.parse(text).method);
      socket.send(respond(text, fixture()));
    });
    else assert.equal(request.url, '/bridge/v4/events');
  });
  let resolve!: () => void; let reject!: (error: unknown) => void;
  const done = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  let count = 0;
  const client = new BridgeClient(`ws://127.0.0.1:${address.port}/bridge/v4/rpc`, {
    retryMs: 10,
    createSocket: url => { const socket = new WebSocket(url, { origin: 'null' }); socket.on('error', error => reject(error)); sockets.push(socket); return socket as unknown as BridgeSocket; },
    onStatus() {}, onSnapshot: snapshot => {
      try {
        assert.equal(snapshot.run.gameName, 'Game'); assert.equal(snapshot.timer.realTimeTicks, 834500000n);
        if (++count === 1) sockets[0].close(); else resolve();
      } catch (error) { reject(error); }
    },
  });
  const deadline = setTimeout(() => reject(new Error('JSON v4 reconnect timed out')), 8000);
  try {
    client.start(); await done;
    assert.deepEqual(paths, ['/bridge/v4/events', '/bridge/v4/rpc', '/bridge/v4/events', '/bridge/v4/rpc']);
    assert.deepEqual([...methods].sort(), ['get_attempt', 'get_completed_count', 'get_context_state', 'get_run', 'get_timer_state']);
  } finally {
    clearTimeout(deadline); client.stop();
    for (const socket of server.clients) socket.terminate();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
