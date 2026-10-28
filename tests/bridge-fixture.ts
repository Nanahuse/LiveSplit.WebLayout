import { definitions, TimerPhase, TimingMethod, BridgeEventType } from '../src/generated/protocol.ts';
import type { AttemptSegment } from '../src/generated/protocol.ts';
import type { BridgeSnapshot, BridgeSocket, Query } from '../src/bridge-client.ts';
export const ticks = (seconds: number) => BigInt(Math.round(seconds * 10000000));
export function attemptSegment(index: number, realTimeTicks: bigint, gameTimeTicks?: bigint): AttemptSegment {
  return { index, splitTime: { realTimeTicks, gameTimeTicks }, customVariables: {} };
}
export function fixture(): BridgeSnapshot {
  return {
    timer: { phase: TimerPhase.RUNNING, splitIndex: 1, realTimeTicks: ticks(83.45), gameTimeTicks: ticks(80.25), isGameTimeInitialized: true, isGameTimePaused: false },
    timerAt: 0, attemptFresh: true,
    run: { gameName: 'Game', categoryName: 'Any%', offsetTicks: 0n, comparisons: ['Personal Best', 'Best Segments'],
      segments: [60, 120, 180].map((end, index) => ({ index, name: ['First', 'Second', 'Third'][index], bestSegmentTime: { realTimeTicks: ticks(50), gameTimeTicks: ticks(45) },
        comparisons: [ { name: 'Personal Best', time: { realTimeTicks: ticks(end), gameTimeTicks: ticks(end - 10) } }, { name: 'Best Segments', time: { realTimeTicks: ticks((index + 1) * 50), gameTimeTicks: ticks((index + 1) * 45) } } ] })) },
    attempt: { attemptCount: 42, segments: [attemptSegment(0, ticks(59), ticks(49))] },
    context: { currentComparison: 'Personal Best', currentTimingMethod: TimingMethod.REAL_TIME, customVariables: { Deaths: '<b>42</b>' } },
    completed: { completedCount: 12 },
  };
}
export const session = 4294967290;
export function stringify(value: unknown): string {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return `[${value.map(stringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}:${stringify(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
// Emit every nullable field and preserve dictionary keys, following the official schema.
export function wire(name: string, value: unknown): unknown {
  return encode((definitions as Record<string, unknown>)[name], value);
}
function encode(schema: any, value: any): unknown {
  if (value === undefined) return null;
  if (schema.$ref) return wire(schema.$ref.split('/').at(-1), value);
  if (schema.anyOf) return encode(schema.anyOf[0], value);
  if (schema.properties) return Object.fromEntries(Object.entries(schema.properties).map(([k, s]) => [k, encode(s, value[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())])]));
  if (schema.items) return value.map((item: unknown) => encode(schema.items, item));
  return value;
}
const results: Record<Query, [string, keyof BridgeSnapshot]> = {
  get_timer_state: ['TimerState', 'timer'], get_attempt: ['AttemptState', 'attempt'], get_run: ['RunState', 'run'],
  get_context_state: ['ContextState', 'context'], get_completed_count: ['CompletedCount', 'completed'],
};
export function respond(data: string, snapshot: BridgeSnapshot, sessionId = session) {
  const request = JSON.parse(data);
  assertQuery(request);
  const [name, key] = results[request.method];
  return stringify({ request_id: request.request_id, session_id: sessionId, result: wire(name, snapshot[key]) });
}
function assertQuery(request: any): asserts request is { request_id: number; method: Query } {
  if (!Object.hasOwn(results, request.method) || Object.hasOwn(request, 'params')) throw new Error('Unexpected write or invalid query request');
}
export class FakeBridgeSocket implements BridgeSocket {
  binaryType = '';
  onopen: BridgeSocket['onopen'] = null; onmessage: BridgeSocket['onmessage'] = null;
  onerror: BridgeSocket['onerror'] = null; onclose: BridgeSocket['onclose'] = null;
  sent: string[] = []; closed = false;
  constructor(readonly url: string) {}
  send(data: string) { this.sent.push(data); }
  close() { this.closed = true; }
  answer(snapshot: BridgeSnapshot, sessionId = session) {
    for (const data of this.sent.splice(0)) this.onmessage?.({ data: respond(data, snapshot, sessionId) });
  }
  event(snapshot: BridgeSnapshot, sequence: number, type: string = BridgeEventType.EVENT_TIMER_SPLIT, sessionId = session) {
    this.onmessage?.({ data: stringify({ session_id: sessionId, event_sequence: sequence, type, timer_state: type === 'run_changed' || type === 'context_changed' ? null : wire('TimerState', snapshot.timer) }) });
  }
}
export const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
