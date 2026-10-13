import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BridgeClient, clockTicks } from '../src/bridge-client.ts';
import type { BridgeSnapshot } from '../src/bridge-client.ts';
import { TimerPhase, BridgeEventType } from '../src/generated/livesplit/bridge/v3/common_pb.ts';
import { fromBinary } from '@bufbuild/protobuf';
import { RequestSchema } from '../src/generated/livesplit/bridge/v3/bridge_pb.ts';
import { fixture, FakeBridgeSocket, flush, session, ticks } from './bridge-fixture.ts';

test('event-first startup discards stale RPC replies, updates immediately, and preserves 64-bit continuity', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; const snapshots: BridgeSnapshot[] = []; const statuses: string[] = [];
  const client = new BridgeClient('ws://localhost:54000/bridge/v3/rpc', {
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
    sockets[0].event(ended, session + 1n);
    assert.equal(snapshots.at(-1)?.timer.phase, TimerPhase.ENDED);
    assert.equal(snapshots.at(-1)?.attemptFresh, false);
    sockets[1].answer(ended); await flush(); assert.equal(snapshots.at(-1)?.attemptFresh, true);
    t.mock.timers.tick(750);
    const methods = sockets[1].sent.map(data => fromBinary(RequestSchema, data).body.case);
    assert.deepEqual(methods, ['getTimerState', 'getContextState']); // no repeated icons/run downloads
    sockets[1].answer(ended); await flush();
    sockets[0].event(ended, session + 3n); assert.equal(statuses.at(-1), 'disconnected');
    assert.ok(sockets[0].closed && sockets[1].closed);
    t.mock.timers.tick(1000); assert.equal(sockets.length, 3);
    sockets[2].onopen?.(); sockets[3].onopen?.(); sockets[3].answer(old, 123n); await flush();
    assert.equal(statuses.at(-1), 'connected');
    sockets[2].event(old, 77n, BridgeEventType.EVENT_CONTEXT_CHANGED, 456n);
    assert.equal(statuses.at(-1), 'disconnected');
  } finally { client.stop(); }
});

test('run/context events and timer resync refresh dependent state', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; const snapshots: BridgeSnapshot[] = [];
  const client = new BridgeClient('ws://localhost/bridge/v3/rpc', {
    createSocket: url => { const s = new FakeBridgeSocket(url); sockets.push(s); return s; },
    onSnapshot: s => snapshots.push(s), onStatus() {}, now: () => 0,
  });
  try {
    const state = fixture(); client.start(); sockets[0].onopen?.(); sockets[1].onopen?.();
    sockets[1].answer(state); await flush();
    state.run.gameName = 'Changed';
    sockets[0].event(state, 10n, BridgeEventType.EVENT_RUN_CHANGED);
    assert.ok(sockets[1].sent.some(data => fromBinary(RequestSchema, data).body.case === 'getRun'));
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.run.gameName, 'Changed');
    state.context.customVariables.Deaths = '99';
    sockets[0].event(state, 11n, BridgeEventType.EVENT_CONTEXT_CHANGED);
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.context.customVariables.Deaths, '99');
    state.timer.splitIndex = 2;
    t.mock.timers.tick(750); sockets[1].answer(state); await flush();
    assert.equal(snapshots.at(-1)?.attemptFresh, false);
    assert.ok(sockets[1].sent.some(data => fromBinary(RequestSchema, data).body.case === 'getAttempt'));
    sockets[1].answer(state); await flush(); assert.equal(snapshots.at(-1)?.attemptFresh, true);
  } finally { client.stop(); }
});

test('loss of either socket and unresponsive RPC invalidate state', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeBridgeSocket[] = []; let status = '';
  const client = new BridgeClient('ws://localhost/bridge/v3/rpc', {
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
