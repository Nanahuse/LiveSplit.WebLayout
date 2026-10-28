import { BridgeEventType, TimerPhase } from './generated/protocol.ts';
import type { TimerState, AttemptState, ContextState, CompletedCount, RunState } from './generated/protocol.ts';
import { readReply, readResult, readEvent } from './bridge-protocol.ts';
import type { Query, RpcReply } from './bridge-protocol.ts';
import type { ConnectionStatus } from './timer.ts';

export interface BridgeSnapshot {
  timer: TimerState; timerAt: number; run: RunState; attempt: AttemptState;
  context: ContextState; completed: CompletedCount; attemptFresh: boolean;
}
export type { Query } from './bridge-protocol.ts';
export interface BridgeSocket {
  binaryType: string;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  send(data: string): void; close(): void;
}
interface Options {
  createSocket?: (url: string) => BridgeSocket;
  now?: () => number;
  onSnapshot: (snapshot: BridgeSnapshot) => void;
  onStatus: (status: ConnectionStatus, message?: string) => void;
  pollMs?: number; timeoutMs?: number; retryMs?: number;
}
const queries: Query[] = ['get_timer_state', 'get_attempt', 'get_run', 'get_context_state', 'get_completed_count'];

/** Read-only v4 transport. Neither timer_operation nor game_time_operation is exposed. */
export class BridgeClient {
  private rpc?: BridgeSocket;
  private events?: BridgeSocket;
  private stopped = true;
  private generation = 0;
  private epoch = 0;
  private session?: number;
  private sequence?: number;
  private requestId = 0;
  private pending = new Map<number, { method: Query; resolve: (response: RpcReply) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> }>();
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
          const message = readEvent(event.data);
          this.checkSession(message.sessionId);
          if (this.sequence !== undefined && message.eventSequence !== (this.sequence === 0xffffffff ? 1 : this.sequence + 1)) throw new Error('Bridge event sequence gap: resynchronizing');
          this.sequence = message.eventSequence; this.epoch++;
          if (message.type === BridgeEventType.EVENT_RUN_CHANGED) this.invalidate(queries);
          else if (message.type === BridgeEventType.EVENT_CONTEXT_CHANGED) this.invalidate(['get_context_state', 'get_timer_state']);
          else {
            if (message.timerState && this.snapshot) {
              this.snapshot = { ...this.snapshot, timer: message.timerState, timerAt: this.now(), attemptFresh: false };
              if (this.ready) this.options.onSnapshot(this.snapshot);
            }
            // Reset can change comparisons, best segments, and context even if run_changed is lost.
            this.invalidate(message.type === BridgeEventType.EVENT_TIMER_RESET ? queries : ['get_timer_state', 'get_attempt', 'get_completed_count']);
          }
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
              const response = readReply(event.data);
              this.checkSession(response.sessionId);
              const pending = this.pending.get(response.requestId);
              if (!pending) throw new Error('Unknown Bridge response request_id');
              this.pending.delete(response.requestId); clearTimeout(pending.timeout);
              if (response.error) pending.reject(new Error(response.error.message));
              else {
                try { response.result = readResult(pending.method, response.result); pending.resolve(response); }
                catch (error) { pending.reject(error as Error); throw error; }
              }
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
  private checkSession(id: number) {
    if (this.session !== undefined && id !== this.session) throw new Error('Bridge session changed: reconnecting');
    this.session = id;
  }
  private query(method: Query): Promise<RpcReply> {
    while (this.pending.has(this.requestId)) this.requestId = (this.requestId + 1) >>> 0;
    const request = { request_id: this.requestId, method };
    this.requestId = (this.requestId + 1) >>> 0;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => this.fail(new Error(`Bridge ${method} timed out`)), this.options.timeoutMs ?? 3000);
      this.pending.set(request.request_id, { method, resolve, reject, timeout });
      try { this.rpc!.send(JSON.stringify(request)); } catch (error) { this.fail(error); }
    });
  }
  private schedulePoll() {
    const gen = this.generation;
    this.poll = setTimeout(() => {
      if (this.stopped || gen !== this.generation) return;
      this.invalidate(['get_timer_state', 'get_context_state']);
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
        const result = await Promise.all(keys.map(async key => ({ key, response: await this.query(key), at: this.now() })));
        if (gen !== this.generation) return;
        // RPC has no event_sequence. Discard the entire batch if events crossed it.
        if (epoch !== this.epoch) { for (const key of keys) this.dirty.add(key); continue; }
        const next = { ...this.snapshot } as BridgeSnapshot;
        for (const { key, response, at } of result) {
          switch (key) {
            case 'get_timer_state': next.timer = response.result as TimerState; next.timerAt = at; break;
            case 'get_run': next.run = response.result as RunState; break;
            case 'get_attempt': next.attempt = response.result as AttemptState; next.attemptFresh = true; break;
            case 'get_context_state': next.context = response.result as ContextState; break;
            case 'get_completed_count': next.completed = response.result as CompletedCount; break;
          }
        }
        if (!next.timer || !next.run || !next.attempt || !next.context || !next.completed) throw new Error('Incomplete Bridge snapshot');
        if (!keys.includes('get_attempt') && this.snapshot && (next.timer.splitIndex !== this.snapshot.timer.splitIndex || next.timer.phase !== this.snapshot.timer.phase)) {
          // A timer resync can discover a change before its event arrives.
          next.attemptFresh = false; this.dirty.add('get_attempt'); this.dirty.add('get_completed_count');
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
