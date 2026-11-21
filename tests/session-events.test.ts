import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bridgeState } from '../src/bridge-state.ts';
import { operationEvents } from '../src/session-events.ts';
import { attemptSegment, fixture, session, ticks } from './bridge-fixture.ts';

for (const [operation, phase, splitIndex] of [
  ['reset', 'not_running', -1],
  ['undo', 'running', 2],
] as const) {
  test(`a final split followed by ${operation} in one sync still reports finish without a result`, () => {
    const endpoint = 'ws://127.0.0.1:54000/bridge/v4/rpc';
    const running = fixture();
    running.timer.splitIndex = 2;
    running.attempt.segments.push(attemptSegment(1, ticks(110), ticks(105)));
    const before = bridgeState(endpoint, running);
    const ended = { ...running.timer, phase: 'ended' as const, splitIndex: 3, realTimeTicks: ticks(150) };
    const timer = { ...running.timer, phase, splitIndex };
    const attempt = operation === 'reset' ? { ...running.attempt, segments: [] } : running.attempt;
    const after = bridgeState(endpoint, { ...running, timer, attempt }, { snapshot: running, state: before });

    const events = operationEvents(before, after, [
      { sessionId: session, eventSequence: 20, type: 'timer_split', timerState: ended },
      { sessionId: session, eventSequence: 21, type: `timer_${operation}`, timerState: timer },
    ]);

    assert.deepEqual(events, [
      { type: 'split', sequence: 20, phase: 'ended', splitIndex: 3, result: null },
      { type: 'finish', sequence: 20, phase: 'ended', splitIndex: 3, result: null },
      { type: operation, sequence: 21, phase, splitIndex, result: null },
    ]);
  });
}
