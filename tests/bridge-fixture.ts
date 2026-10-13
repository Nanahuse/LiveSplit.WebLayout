import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { RequestSchema, ResponseSchema } from '../src/generated/livesplit/bridge/v3/bridge_pb.ts';
import { TimerStateSchema, AttemptStateSchema, ContextStateSchema, CompletedCountSchema, TimerPhase, TimingMethod, BridgeEventSchema, BridgeEventType } from '../src/generated/livesplit/bridge/v3/common_pb.ts';
import { RunStateSchema } from '../src/generated/livesplit/bridge/v3/run_pb.ts';
import type { BridgeSnapshot, BridgeSocket } from '../src/bridge-client.ts';
export const ticks = (seconds: number) => BigInt(Math.round(seconds * 10000000));
export function fixture(): BridgeSnapshot {
  return {
    timer: create(TimerStateSchema, { phase: TimerPhase.RUNNING, splitIndex: 1, realTimeTicks: ticks(83.45), gameTimeTicks: ticks(80.25), isGameTimeInitialized: true }),
    timerAt: 0, attemptFresh: true,
    run: create(RunStateSchema, { gameName: 'Game', categoryName: 'Any%', comparisons: ['Personal Best', 'Best Segments'],
      segments: [60, 120, 180].map((end, index) => ({ index, name: ['First', 'Second', 'Third'][index], bestSegmentTime: { realTimeTicks: ticks(50), gameTimeTicks: ticks(45) },
        comparisons: [ { name: 'Personal Best', time: { realTimeTicks: ticks(end), gameTimeTicks: ticks(end - 10) } }, { name: 'Best Segments', time: { realTimeTicks: ticks((index + 1) * 50), gameTimeTicks: ticks((index + 1) * 45) } } ] })) }),
    attempt: create(AttemptStateSchema, { attemptCount: 42, segments: [{ index: 0, splitTime: { realTimeTicks: ticks(59), gameTimeTicks: ticks(49) } }] }),
    context: create(ContextStateSchema, { currentComparison: 'Personal Best', currentTimingMethod: TimingMethod.REAL_TIME, customVariables: { Deaths: '<b>42</b>' } }),
    completed: create(CompletedCountSchema, { completedCount: 12 }),
  };
}
export const session = 9007199254740999n;
export function respond(data: Uint8Array, snapshot: BridgeSnapshot, sessionId = session) {
  const request = fromBinary(RequestSchema, data);
  let body;
  switch (request.body.case) {
    case 'getTimerState': body = { case: 'getTimerState' as const, value: { timerState: snapshot.timer } }; break;
    case 'getAttempt': body = { case: 'getAttempt' as const, value: { attempt: snapshot.attempt } }; break;
    case 'getRun': body = { case: 'getRun' as const, value: { run: snapshot.run } }; break;
    case 'getContextState': body = { case: 'getContextState' as const, value: { contextState: snapshot.context } }; break;
    case 'getCompletedCount': body = { case: 'getCompletedCount' as const, value: { completedCount: snapshot.completed } }; break;
    default: throw new Error('Unexpected write request');
  }
  return toBinary(ResponseSchema, create(ResponseSchema, { protocolVersion: 3, requestId: request.requestId, sessionId, body }));
}
export class FakeBridgeSocket implements BridgeSocket {
  binaryType = '';
  onopen: BridgeSocket['onopen'] = null; onmessage: BridgeSocket['onmessage'] = null;
  onerror: BridgeSocket['onerror'] = null; onclose: BridgeSocket['onclose'] = null;
  sent: Uint8Array[] = []; closed = false;
  constructor(readonly url: string) {}
  send(data: Uint8Array) { this.sent.push(data); }
  close() { this.closed = true; }
  answer(snapshot: BridgeSnapshot, sessionId = session) {
    for (const data of this.sent.splice(0)) this.onmessage?.({ data: respond(data, snapshot, sessionId) });
  }
  event(snapshot: BridgeSnapshot, sequence: bigint, type = BridgeEventType.EVENT_TIMER_SPLIT, sessionId = session) {
    this.onmessage?.({ data: toBinary(BridgeEventSchema, create(BridgeEventSchema, { sessionId, eventSequence: sequence, type, timerState: snapshot.timer })) });
  }
}
export const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
