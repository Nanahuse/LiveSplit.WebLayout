import { test } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { TimerConnection, formatTime } from '../src/timer.ts';
import type { ConnectionStatus, TimerSocket } from '../src/timer.ts';
import { RunReadout } from '../src/readout.ts';
import { Comparisons } from '../src/comparisons.ts';

test('real LiveSplit: reads named comparisons without changing the selected comparison', { timeout: 15000 }, async () => {
  const comparisons = new Comparisons();
  comparisons.names = new Set(['Personal Best', 'Best Segments']); comparisons.begin();
  const socket = new WebSocket(process.env.LIVESPLIT_URL ?? 'ws://localhost:16834/livesplit', { perMessageDeflate: true });
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Comparison snapshot timed out')), 12000);
      socket.on('error', error => { clearTimeout(timeout); reject(error); });
      socket.on('open', () => socket.send(comparisons.next()!));
      socket.on('message', value => {
        comparisons.receive(String(value));
        const command = comparisons.next();
        if (command) socket.send(command);
        else { clearTimeout(timeout); resolve(); }
      });
    });
    assert.match(comparisons.phase, /^(NotRunning|Running|Paused|Ended)$/);
    console.log(`Named comparison snapshot: ${comparisons.phase}, index ${comparisons.index}`);
  } finally { socket.close(); }
});

// Opt-in: reads the real server without starting, pausing, or resetting a run.
test('real LiveSplit: receives time samples and recovers from a dropped connection', { timeout: 15000 }, async () => {
  const endpoint = process.env.LIVESPLIT_URL ?? 'ws://localhost:16834/livesplit';
  const statuses: ConnectionStatus[] = [];
  const sockets: WebSocket[] = [];
  let raw = '';
  let samples = 0;
  let finish!: () => void;
  let fail!: (error: unknown) => void;
  const done = new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; });
  const deadline = setTimeout(() => fail(new Error(`LiveSplit did not provide enough samples at ${endpoint}: ${samples} samples, ${sockets.length} connections, states: ${statuses.filter((state, i) => state !== statuses[i - 1]).join(', ')}`)), 12000);
  const client = new TimerConnection(endpoint, {
    createSocket: address => {
      // Match browser negotiation. The tested server returns empty subsequent
      // messages to Node's native client, which does not offer permessage-deflate.
      const socket = new WebSocket(address, { perMessageDeflate: true });
      sockets.push(socket);
      socket.addEventListener('message', event => { raw = String(event.data); });
      return socket as unknown as TimerSocket;
    },
    onStatus: status => statuses.push(status),
    onTime: time => {
      try {
        assert.deepEqual(time, formatTime(raw));
        assert.match(time.whole, /^-?\d+:\d{2}(?::\d{2})?$/);
        samples++;
        if (samples === 30) sockets[0].close();
        if (samples === 60) finish();
      } catch (error) { fail(error); }
    },
  });
  try {
    client.start();
    await done;
    assert.equal(sockets.length, 2);
    assert.ok(statuses.includes('disconnected'));
    assert.equal(statuses.at(-1), 'connected');
    console.log(`Received ${samples} real samples; reconnected successfully; last time: ${raw}`);
  } finally {
    clearTimeout(deadline);
    client.stop();
  }
});

test('real LiveSplit: reads supplementary fields while tolerating unsupported commands', { timeout: 25000 }, async () => {
  const run = new RunReadout();
  const seen = new Set<string>();
  const cycles: number[] = [];
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const done = new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; });
  const deadline = setTimeout(() => fail(new Error('Supplementary readout did not complete a cycle')), 22000);
  const client = new TimerConnection(process.env.LIVESPLIT_URL ?? 'ws://localhost:16834/livesplit', {
    createSocket: address => new WebSocket(address, { perMessageDeflate: true }) as unknown as TimerSocket,
    onTime() {}, onStatus() {}, timeout: 1000, retry: 250,
    readout: {
      nextCommand: () => run.nextCommand(),
      nextDelay: () => run.nextDelay(),
      onResponse(command, value) {
        run.receive(command, value);
        if (command === 'getbestpossibletime') cycles.push(Date.now());
        if (!command.startsWith('getsplitname ')) seen.add(command);
        if (cycles.length >= 20 && ['getgamename', 'getcategoryname', 'getattemptcount', 'getcompletedcount', 'getsplitcount', 'getbestpossibletime', 'getfinaltime'].every(field => seen.has(field))) finish();
      },
    },
  });
  try {
    client.start(); await done;
    assert.match(run.values.get('getcurrenttimerphase') ?? '', /^(NotRunning|Running|Paused|Ended)$/);
    assert.match(run.values.get('getsplitindex') ?? '', /^-?\d+$/);
    console.log(`Supplementary fields: ${run.values.size} values; ${run.unavailable.size} unanswered commands`);
    console.log(`Fast read cycle average: ${Math.round((cycles.at(-1)! - cycles[0]) / (cycles.length - 1))}ms (${cycles.length} cycles)`);
  } finally { clearTimeout(deadline); client.stop(); }
});
