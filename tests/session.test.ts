import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ClockState, SessionState } from '../src/bridge-state.ts';
import type { SessionEvent, SessionEventType } from '../src/session-events.ts';
import { attemptSegment, FakeBridgeSocket, fixture, flush, ticks } from './bridge-fixture.ts';

test('shared Session separates frames, confirmed state and ordered operation events', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const sockets: FakeBridgeSocket[] = [];
  class Socket extends FakeBridgeSocket {
    constructor(url: string) { super(url); sockets.push(this); }
  }
  const browser = Object.assign(new EventTarget(), {
    location: new URL('file:///C:/layouts/index.html'),
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  Object.assign(globalThis, { window: browser, WebSocket: Socket });
  const { getSession } = await import('../src/session.ts');
  const s = fixture();
  const shared = getSession();
  assert.equal(shared, getSession('ws://127.0.0.1:54000/bridge/v4/rpc'));
  assert.equal(sockets.length, 0);
  const states: SessionState[] = [];
  const events: SessionEvent[] = [];
  const off = [
    shared.subscribeState(state => states.push(state)),
    ...(['start', 'split', 'skip', 'undo', 'reset', 'finish', 'pause', 'resume', 'personal-best', 'best-segment'] as const)
      .map(type => shared.on(type, event => {
        assert.equal(shared.getState().attemptFresh, true);
        events.push(event);
      })),
  ];
  const kinds = () => events.map(event => event.type);
  const assertKinds = (expected: SessionEventType[]) => assert.deepEqual(kinds(), expected);
  const resolve = async (socket: FakeBridgeSocket) => {
    // An event can arrive with a poll or earlier event RPC already in flight.
    for (let i = 0; i < 4 && socket.sent.length; i++) { socket.answer(s); await flush(); }
  };
  try {
    assert.equal(states.length, 1);
    sockets[0].onopen?.(); sockets[1].onopen?.();
    sockets[0].event(s, 10);
    await resolve(sockets[1]);
    assert.equal(states.length, 2);
    assertKinds([]); // a startup event cannot be attributed to a prior snapshot
    assert.equal(frames.size, 0);

    const clocks: ClockState[] = [];
    const unsubClock = shared.subscribeClock(clock => clocks.push(clock));
    assert.equal(frames.size, 1);
    const [[id, frame]] = [...frames];
    frames.delete(id); frame(performance.now() + 250);
    assert.ok(clocks.at(-1)!.realTime! > 83.6);
    assert.equal(states.length, 2);
    unsubClock();
    assert.equal(frames.size, 0);
    assert.equal(sockets[0].closed, false);

    const initial = shared.getState();
    s.timer.realTimeTicks = ticks(97);
    t.mock.timers.tick(750); await resolve(sockets[1]);
    assert.equal(shared.getState(), initial); // no state notification for a clock-only poll
    assert.ok(initial.run && Object.isFrozen(initial.run.segments[0].comparisons['Personal Best']));
    assert.equal(initial.attempt?.segments[0].splitTime.realTime, 59);

    s.timer.splitIndex = 2;
    s.attempt.segments.push(attemptSegment(1, ticks(99), ticks(95)));
    s.timer.realTimeTicks = ticks(99);
    sockets[0].event(s, 11);
    sockets[0].event(s, 11); // exact duplicate is ignored
    assert.equal(shared.getState().splitIndex, 1);
    assert.equal(shared.getClock().splitIndex, 2);
    assertKinds([]);
    await resolve(sockets[1]);
    assert.equal(shared.getState().splitIndex, 2);
    assertKinds(['split', 'best-segment']);
    const split = events[0].result!;
    assert.equal(split.name, 'Second');
    assert.deepEqual(split.splitTime, { realTime: 99, gameTime: 95 });
    assert.deepEqual(split.deltas['Personal Best'], { realTime: -21, gameTime: -15 });
    assert.deepEqual(shared.getState().delta, { realTime: -21, gameTime: -15 });
    assert.equal(events[1].type === 'best-segment' && events[1].timingMethods.join(), 'realTime');

    s.timer.splitIndex = 1;
    s.attempt.segments.pop();
    sockets[0].event(s, 12, 'timer_undo');
    await resolve(sockets[1]);
    assert.equal(shared.getState().attempt?.segments.length, 1);
    s.timer.splitIndex = 2;
    sockets[0].event(s, 13, 'timer_skipped');
    await resolve(sockets[1]);
    s.timer.phase = 'paused';
    sockets[0].event(s, 14, 'timer_phase_changed'); await resolve(sockets[1]);
    s.timer.phase = 'running';
    sockets[0].event(s, 15, 'timer_phase_changed'); await resolve(sockets[1]);
    s.timer.phase = 'ended';
    s.timer.splitIndex = 3;
    s.timer.realTimeTicks = ticks(170);
    s.attempt.segments.push(attemptSegment(2, ticks(170), ticks(165)));
    s.context.currentComparison = 'Best Segments';
    sockets[0].event(s, 16);
    await resolve(sockets[1]);
    assertKinds(['split', 'best-segment', 'undo', 'skip', 'pause', 'resume', 'split', 'finish', 'personal-best']);
    assert.equal(events.at(-1)?.result?.deltas['Personal Best'].realTime, -10);
    assert.equal(events.at(-1)?.result?.deltas['Best Segments'].realTime, 20);

    sockets[0].onclose?.();
    assert.equal(shared.getState().status, 'disconnected');
    t.mock.timers.tick(1000);
    sockets[2].onopen?.(); sockets[3].onopen?.(); await resolve(sockets[3]);
    assert.equal(shared.getState().phase, 'ended');
    assert.equal(events.length, 9);

    s.timer.phase = 'not_running';
    s.timer.splitIndex = -1;
    s.attempt.segments = [];
    sockets[2].event(s, 1, 'timer_reset'); await resolve(sockets[3]);
    s.timer.phase = 'running';
    s.timer.splitIndex = 0;
    s.attempt.attemptCount++;
    sockets[2].event(s, 2, 'timer_started'); await resolve(sockets[3]);
    assert.deepEqual(kinds().slice(-2), ['reset', 'start']);

    // Only the last write to an attempt row survives an overlapping RPC batch.
    s.timer.splitIndex = 1;
    sockets[2].event(s, 3);
    s.timer.splitIndex = 0;
    sockets[2].event(s, 4, 'timer_undo');
    s.timer.splitIndex = 1;
    s.attempt.segments.push(attemptSegment(0, ticks(60)));
    sockets[2].event(s, 5);
    await resolve(sockets[3]);
    assert.deepEqual(kinds().slice(-3), ['split', 'undo', 'split']);
    assert.equal(events.at(-3)?.result, null);
    assert.equal(events.at(-1)?.result?.splitTime.realTime, 60);
    assert.equal(initial.splitIndex, 1); // an earlier snapshot remains immutable
  } finally {
    for (const unsubscribe of off) unsubscribe();
  }
  assert.ok(sockets.every(socket => socket.closed));
  assert.equal(shared.getState().status, 'connecting');
});
