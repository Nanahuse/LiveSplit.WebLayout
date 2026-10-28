import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BridgeClient, clockTicks } from '../src/bridge-client.ts';
import type { BridgeSnapshot } from '../src/bridge-client.ts';
import { TimerPhase, BridgeEventType } from '../src/generated/protocol.ts';
import { fixture, FakeBridgeSocket, flush, session, ticks, stringify } from './bridge-fixture.ts';

test('event-first startup discards stale RPC replies, updates immediately, and preserves uint32 continuity', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; const snapshots: BridgeSnapshot[] = []; const statuses: string[] = [];
  const client = new BridgeClient('ws://localhost:54000/bridge/v4/rpc', {
    createSocket: url => { const socket = new FakeBridgeSocket(url); sockets.push(socket); return socket; },
    onSnapshot: s => snapshots.push(s), onStatus: status => statuses.push(status), now: () => 0,
  });
  try {
    client.start(); assert.ok(sockets[0].url.endsWith('/events')); assert.equal(sockets.length, 1);
    sockets[0].onopen?.(); sockets[1].onopen?.();
    const old = fixture(), newer = fixture(); newer.timer.splitIndex = 2;
    sockets[0].event(newer, session); // first sequence need not be 1
    sockets[1].answer(old); await flush(); assert.equal(snapshots.length, 0);
    sockets[1].answer(newer); await flush(); assert.equal(snapshots.at(-1)?.timer.splitIndex, 2);
    const ended = fixture(); ended.timer.phase = TimerPhase.ENDED; ended.timer.splitIndex = 3;
    sockets[0].event(ended, session + 1);
    assert.equal(snapshots.at(-1)?.timer.phase, TimerPhase.ENDED);
    assert.equal(snapshots.at(-1)?.attemptFresh, false);
    sockets[1].answer(ended); await flush(); assert.equal(snapshots.at(-1)?.attemptFresh, true);
    t.mock.timers.tick(750);
    const methods = sockets[1].sent.map(data => JSON.parse(data).method);
    assert.deepEqual(methods, ['get_timer_state', 'get_context_state']); // no repeated icons/run downloads
    sockets[1].answer(ended); await flush();
    sockets[0].event(ended, session + 3); assert.equal(statuses.at(-1), 'disconnected');
    assert.ok(sockets[0].closed && sockets[1].closed);
    t.mock.timers.tick(1000); assert.equal(sockets.length, 3);
    sockets[2].onopen?.(); sockets[3].onopen?.(); sockets[3].answer(old, 123); await flush();
    assert.equal(statuses.at(-1), 'connected');
    sockets[2].event(old, 77, BridgeEventType.EVENT_CONTEXT_CHANGED, 456);
    assert.equal(statuses.at(-1), 'disconnected');
  } finally { client.stop(); }
});

test('run/context events and timer resync refresh dependent state', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; const snapshots: BridgeSnapshot[] = [];
  const client = new BridgeClient('ws://localhost/bridge/v4/rpc', {
    createSocket: url => { const s = new FakeBridgeSocket(url); sockets.push(s); return s; },
    onSnapshot: s => snapshots.push(s), onStatus() {}, now: () => 0,
  });
  try {
    const state = fixture(); client.start(); sockets[0].onopen?.(); sockets[1].onopen?.();
    sockets[1].answer(state); await flush();
    state.run.gameName = 'Changed';
    sockets[0].event(state, 10, BridgeEventType.EVENT_RUN_CHANGED);
    assert.ok(sockets[1].sent.some(data => JSON.parse(data).method === 'get_run'));
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.run.gameName, 'Changed');
    state.context.customVariables.Deaths = '99';
    sockets[0].event(state, 11, BridgeEventType.EVENT_CONTEXT_CHANGED);
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.context.customVariables.Deaths, '99');
    state.timer.splitIndex = 2;
    t.mock.timers.tick(750); sockets[1].answer(state); await flush();
    assert.equal(snapshots.at(-1)?.attemptFresh, false);
    assert.ok(sockets[1].sent.some(data => JSON.parse(data).method === 'get_attempt'));
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.attemptFresh, true);
  } finally { client.stop(); }
});

test('loss of either socket and unresponsive RPC invalidate state', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; let status = '';
  const client = new BridgeClient('ws://localhost/bridge/v4/rpc', {
    createSocket: url => { const s = new FakeBridgeSocket(url); sockets.push(s); return s; },
    onSnapshot() {}, onStatus: s => { status = s; }, timeoutMs: 100,
  });
  try {
    client.start(); sockets[0].onopen?.(); sockets[1].onopen?.();
    t.mock.timers.tick(100); await flush(); assert.equal(status, 'disconnected');
    t.mock.timers.tick(1000); sockets[2].onopen?.(); sockets[3].onopen?.(); sockets[3].answer(fixture()); await flush();
    sockets[3].onclose?.(); assert.equal(status, 'disconnected'); assert.ok(sockets[2].closed);
  } finally { client.stop(); }
});

test('clock interpolates real/game time independently, preserves unset and bounds stale time', () => {
  const s = fixture();
  assert.equal(clockTicks(s, 500), ticks(83.95));
  assert.equal(clockTicks(s, 500, true), ticks(80.75));
  s.timer.isGameTimePaused = true; assert.equal(clockTicks(s, 500, true), ticks(80.25));
  s.timer.phase = TimerPhase.PAUSED; assert.equal(clockTicks(s, 500), ticks(83.45));
  s.timer.phase = TimerPhase.ENDED; assert.equal(clockTicks(s, 500), ticks(83.45));
  s.timer.isGameTimeInitialized = false; assert.equal(clockTicks(s, 500, true), undefined);
  s.timer.phase = TimerPhase.RUNNING; assert.equal(clockTicks(s, 9000), ticks(85.45));
});

test('v4 wraps sequence and request IDs, and reset with null state refreshes all queries', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; const snapshots: BridgeSnapshot[] = []; let status = '';
  const client = new BridgeClient('ws://localhost/bridge/v4/rpc', {
    createSocket: url => { const s = new FakeBridgeSocket(url); sockets.push(s); return s; },
    onSnapshot: s => snapshots.push(s), onStatus: s => { status = s; },
  });
  try {
    // Exercise allocation at the uint32 boundary with real pending requests.
    (client as unknown as { requestId: number }).requestId = 0xfffffffe;
    client.start(); sockets[0].onopen?.(); sockets[1].onopen?.();
    assert.deepEqual(sockets[1].sent.map(data => JSON.parse(data).request_id), [0xfffffffe, 0xffffffff, 0, 1, 2]);
    for (const text of sockets[1].sent) assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ['method', 'request_id']);
    const state = fixture(); sockets[1].answer(state); await flush();
    sockets[0].event(state, 0xffffffff); sockets[1].answer(state); await flush();
    sockets[0].onmessage?.({ data: stringify({ session_id: session, event_sequence: 1, type: 'timer_reset', timer_state: null }) });
    assert.equal(status, 'connected');
    assert.equal(sockets[1].sent.length, 5);
    state.timer.phase = TimerPhase.NOT_RUNNING; state.run.gameName = 'Reset Run';
    sockets[1].answer(state); await flush();
    assert.equal(snapshots.at(-1)?.run.gameName, 'Reset Run');
    assert.equal(snapshots.at(-1)?.timer.phase, TimerPhase.NOT_RUNNING);
  } finally { client.stop(); }
});

test('v4 query errors and malformed results disconnect without publishing a partial snapshot', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const result of ['"error":{"code":"internal_error","message":"failed"}', '"result":null', '"result":{"phase":"running"}']) {
    const sockets: FakeBridgeSocket[] = []; let status = ''; let count = 0;
    const client = new BridgeClient('ws://localhost/bridge/v4/rpc', {
      createSocket: url => { const s = new FakeBridgeSocket(url); sockets.push(s); return s; },
      onSnapshot: () => count++, onStatus: s => { status = s; },
    });
    try {
      client.start(); sockets[0].onopen?.(); sockets[1].onopen?.();
      const id = JSON.parse(sockets[1].sent[0]).request_id;
      sockets[1].onmessage?.({ data: `{"request_id":${id},"session_id":1,${result}}` });
      await flush(); assert.equal(status, 'disconnected'); assert.equal(count, 0);
      assert.ok(sockets.every(s => s.closed));
    } finally { client.stop(); }
  }
});
