import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { BridgeClient } from '../src/bridge-client.ts';
import type { BridgeSocket, BridgeSnapshot } from '../src/bridge-client.ts';
import { applyBridgeSnapshot } from '../src/bridge-state.ts';
import { RunReadout } from '../src/readout.ts';

test('real Bridge v3: local-file origin synchronizes read-only and reconnects with full run', { timeout: 18000 }, async () => {
  const sockets: WebSocket[] = [];
  let count = 0; let resolve!: () => void; let reject!: (e: Error) => void;
  const done = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  const deadline = setTimeout(() => reject(new Error('LiveSplit.Bridge v3 synchronization unavailable')), 15000);
  const client = new BridgeClient(process.env.LIVESPLIT_URL ?? 'ws://127.0.0.1:54000/bridge/v3/rpc', {
    createSocket: url => { const socket = new WebSocket(url, { origin: 'null' }); sockets.push(socket); return socket as unknown as BridgeSocket; },
    onStatus() {}, onSnapshot: (snapshot: BridgeSnapshot) => {
      try {
        const model = new RunReadout(); applyBridgeSnapshot(model, snapshot, performance.now());
        assert.ok(snapshot.timer.phase > 0); assert.equal(model.names.size, snapshot.run.segments.length);
        console.log(`Bridge snapshot: ${model.values.get('getcurrenttimerphase')}, ${model.count} splits, ${model.liveTime}`);
        count++; if (count === 1) sockets[0].close(); else if (sockets.length >= 4) resolve();
      } catch (error) { reject(error as Error); }
    },
  });
  try { client.start(); await done; } finally { clearTimeout(deadline); client.stop(); }
});
