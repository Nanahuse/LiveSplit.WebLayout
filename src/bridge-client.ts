import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { RequestSchema, ResponseSchema } from './generated/livesplit/bridge/v3/bridge_pb.ts';
import type { Response } from './generated/livesplit/bridge/v3/bridge_pb.ts';
import { BridgeEventSchema, BridgeEventType, TimerPhase } from './generated/livesplit/bridge/v3/common_pb.ts';
import type { TimerState, AttemptState, ContextState, CompletedCount } from './generated/livesplit/bridge/v3/common_pb.ts';
import type { RunState } from './generated/livesplit/bridge/v3/run_pb.ts';
import type { ConnectionStatus } from './timer.ts';

export interface BridgeSnapshot {
  timer: TimerState; timerAt: number; run: RunState; attempt: AttemptState;
  context: ContextState; completed: CompletedCount; attemptFresh: boolean;
}
export type Query = 'getTimerState' | 'getRun' | 'getAttempt' | 'getContextState' | 'getCompletedCount';
export interface BridgeSocket {
  binaryType: string;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  send(data: Uint8Array): void; close(): void;
}
interface Options {
  createSocket?: (url: string) => BridgeSocket;
  now?: () => number;
  onSnapshot: (snapshot: BridgeSnapshot) => void;
  onStatus: (status: ConnectionStatus, message?: string) => void;
  pollMs?: number; timeoutMs?: number; retryMs?: number;
}
const queries: Query[] = ['getTimerState', 'getAttempt', 'getRun', 'getContextState', 'getCompletedCount'];
function bytes(data: unknown): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Uint8Array) return data;
  throw new Error('Bridge v3 requires binary Protobuf messages');
}

/** Read-only v3 transport. Neither timer_operation nor game_time_operation is exposed. */
export class BridgeClient {
  private rpc?: BridgeSocket;
  private events?: BridgeSocket;
  private stopped = true;
  private generation = 0;
  private epoch = 0;
  private session?: bigint;
  private sequence?: bigint;
  private requestId = 0n;
  private pending = new Map<bigint, { method: Query; resolve: (response: Response) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> }>();
  private dirty = new Set<Query>();
  private syncing = false;
  private ready = false;
  private snapshot?: BridgeSnapshot;
  private retry?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setTimeout>;
  private opening?: ReturnType<typeof setTimeout>;
  readonly now: () => number;
  constructor(readonly endpoint: string, private options: Options) { this.now = options.now ?? (() => performance.now()); }
  start() { if (!this.stopped) return; this.stopped = false; this.connect(); }
  stop() { this.stopped = true; this.dispose(); }
  private dispose() {
    this.generation++; clearTimeout(this.retry); clearTimeout(this.poll); clearTimeout(this.opening);
    for (const socket of [this.rpc, this.events]) {
      if (!socket) continue;
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null; socket.close();
    }
    this.rpc = this.events = undefined;
    for (const item of this.pending.values()) { clearTimeout(item.timeout); item.reject(new Error('Bridge disconnected')); }
    this.pending.clear(); this.ready = false; this.syncing = false; this.snapshot = undefined;
    this.session = this.sequence = undefined; this.dirty.clear();
  }
  private fail(error: unknown) {
    if (this.stopped) return;
    this.dispose(); this.options.onStatus('disconnected', error instanceof Error ? error.message : String(error));
    this.retry = setTimeout(() => this.connect(), this.options.retryMs ?? 1000);
  }
  private socket(url: string) { return this.options.createSocket?.(url) ?? new WebSocket(url) as unknown as BridgeSocket; }
  private connect() {
    if (this.stopped) return;
    const gen = this.generation;
    this.options.onStatus('connecting');
    try {
      this.opening = setTimeout(() => this.fail(new Error('Bridge connection timed out')), this.options.timeoutMs ?? 3000);
      const events = this.events = this.socket(this.endpoint.replace(/\/rpc$/, '/events'));
      events.binaryType = 'arraybuffer';
      events.onerror = events.onclose = () => { if (gen === this.generation) this.fail(new Error('Bridge Events connection lost')); };
      events.onmessage = event => {
        if (gen !== this.generation) return;
        try {
          const message = fromBinary(BridgeEventSchema, bytes(event.data));
          this.checkSession(message.sessionId);
          if (message.eventSequence === 0n || (this.sequence !== undefined && message.eventSequence !== this.sequence + 1n)) throw new Error('Bridge event sequence gap: resynchronizing');
          this.sequence = message.eventSequence; this.epoch++;
          if (message.type === BridgeEventType.EVENT_RUN_CHANGED) this.invalidate(queries);
          else if (message.type === BridgeEventType.EVENT_CONTEXT_CHANGED) this.invalidate(['getContextState', 'getTimerState']);
          else if (message.type >= BridgeEventType.EVENT_TIMER_STARTED && message.type <= BridgeEventType.EVENT_TIMER_PHASE_CHANGED) {
            if (message.timerState && this.snapshot) {
              this.snapshot = { ...this.snapshot, timer: message.timerState, timerAt: this.now(), attemptFresh: false };
              if (this.ready) this.options.onSnapshot(this.snapshot);
            }
            this.invalidate(['getTimerState', 'getAttempt', 'getCompletedCount']);
          } else this.invalidate(queries);
        } catch (error) { this.fail(error); }
      };
      events.onopen = () => {
        if (gen !== this.generation) return;
        try {
          const rpc = this.rpc = this.socket(this.endpoint); rpc.binaryType = 'arraybuffer';
          rpc.onerror = rpc.onclose = () => { if (gen === this.generation) this.fail(new Error('Bridge RPC connection lost')); };
          rpc.onmessage = event => {
            if (gen !== this.generation) return;
            try {
              const response = fromBinary(ResponseSchema, bytes(event.data));
              if (response.protocolVersion !== 3) throw new Error('LiveSplit.Bridge Protocol v3 is required');
              this.checkSession(response.sessionId);
              const pending = this.pending.get(response.requestId);
              if (!pending) throw new Error('Unknown Bridge response request_id');
              this.pending.delete(response.requestId); clearTimeout(pending.timeout);
              if (response.body.case !== pending.method) {
                pending.reject(new Error(response.body.case === 'error' ? response.body.value.message : 'Bridge response type mismatch'));
              } else pending.resolve(response);
            } catch (error) { this.fail(error); }
          };
          rpc.onopen = () => {
            if (gen !== this.generation) return;
            clearTimeout(this.opening); this.ready = true; this.invalidate(queries); this.schedulePoll();
          };
        } catch (error) { this.fail(error); }
      };
    } catch (error) { this.fail(error); }
  }
  private checkSession(id: bigint) {
    if (id === 0n || (this.session !== undefined && id !== this.session)) throw new Error('Bridge session changed: reconnecting');
    this.session = id;
  }
  private query(method: Query): Promise<Response> {
    const request = create(RequestSchema, { protocolVersion: 3, requestId: ++this.requestId, body: { case: method, value: {} } });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => this.fail(new Error(`Bridge ${method} timed out`)), this.options.timeoutMs ?? 3000);
      this.pending.set(request.requestId, { method, resolve, reject, timeout });
      try { this.rpc!.send(toBinary(RequestSchema, request)); } catch (error) { this.fail(error); }
    });
  }
  private schedulePoll() {
    const gen = this.generation;
    this.poll = setTimeout(() => {
      if (this.stopped || gen !== this.generation) return;
      this.invalidate(['getTimerState', 'getContextState']);
      if (gen === this.generation) this.schedulePoll();
    }, this.options.pollMs ?? 750);
  }
  private invalidate(keys: Query[]) { for (const key of keys) this.dirty.add(key); if (this.ready) void this.sync(); }
  private async sync() {
    if (this.syncing) return;
    this.syncing = true; const gen = this.generation;
    try {
      while (this.dirty.size && gen === this.generation) {
        const keys = [...this.dirty]; this.dirty.clear(); const epoch = this.epoch;
        const result = await Promise.all(keys.map(async key => ({ response: await this.query(key), at: this.now() })));
        if (gen !== this.generation) return;
        // RPC has no event_sequence. Discard the entire batch if events crossed it.
        if (epoch !== this.epoch) { for (const key of keys) this.dirty.add(key); continue; }
        const next = { ...this.snapshot } as BridgeSnapshot;
        for (const { response, at } of result) {
          const body = response.body;
          switch (body.case) {
            case 'getTimerState': if (!body.value.timerState) throw new Error('Missing TimerState'); next.timer = body.value.timerState; next.timerAt = at; break;
            case 'getRun': if (!body.value.run) throw new Error('Missing RunState'); next.run = body.value.run; break;
            case 'getAttempt': if (!body.value.attempt) throw new Error('Missing AttemptState'); next.attempt = body.value.attempt; next.attemptFresh = true; break;
            case 'getContextState': if (!body.value.contextState) throw new Error('Missing ContextState'); next.context = body.value.contextState; break;
            case 'getCompletedCount': if (!body.value.completedCount) throw new Error('Missing CompletedCount'); next.completed = body.value.completedCount; break;
          }
        }
        if (!next.timer || !next.run || !next.attempt || !next.context || !next.completed) throw new Error('Incomplete Bridge snapshot');
        if (!keys.includes('getAttempt') && this.snapshot && (next.timer.splitIndex !== this.snapshot.timer.splitIndex || next.timer.phase !== this.snapshot.timer.phase)) {
          // A timer resync can discover a change before its event arrives.
          next.attemptFresh = false; this.dirty.add('getAttempt'); this.dirty.add('getCompletedCount');
        }
        this.snapshot = next; this.options.onStatus('connected'); this.options.onSnapshot(next);
      }
    } catch (error) { if (gen === this.generation) this.fail(error); }
    finally { if (gen === this.generation) this.syncing = false; }
  }
}

export function clockTicks(snapshot: BridgeSnapshot, now: number, game = false): bigint | undefined {
  const timer = snapshot.timer;
  const value = game ? timer.isGameTimeInitialized ? timer.gameTimeTicks : undefined : timer.realTimeTicks;
  if (value === undefined) return undefined;
  const elapsed = Math.min(Math.max(0, now - snapshot.timerAt), 2000);
  return value + (timer.phase === TimerPhase.RUNNING && (!game || !timer.isGameTimePaused) ? BigInt(Math.floor(elapsed * 10000)) : 0n);
}
