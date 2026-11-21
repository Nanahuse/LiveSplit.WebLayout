import { BridgeClient } from './bridge-client.ts';
import type { BridgeSnapshot } from './bridge-client.ts';
import type { BridgeEvent } from './bridge-protocol.ts';
import { bridgeClock, bridgeState, emptyState } from './bridge-state.ts';
import type { ClockState, SessionState } from './bridge-state.ts';
import { operationEvents } from './session-events.ts';
import type { SessionEvent, SessionEventType } from './session-events.ts';
import { getEndpoint } from './timer.ts';

type Listener<T> = (value: T) => void;
type Unsubscribe = () => void;

export interface Session {
  getState(): Readonly<SessionState>;
  getClock(): ClockState;
  subscribeState(callback: Listener<Readonly<SessionState>>): Unsubscribe;
  subscribeClock(callback: Listener<ClockState>): Unsubscribe;
  on<T extends SessionEventType>(event: T, callback: Listener<Extract<SessionEvent, { type: T }>>): Unsubscribe;
}

function notify<T>(listener: Listener<T>, value: T) {
  try { listener(value); }
  catch (error) {
    if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
    else console.error(error);
  }
}
function publish<T>(listeners: Set<Listener<T>>, value: T) {
  for (const listener of [...listeners]) if (listeners.has(listener)) notify(listener, value);
}

class SharedSession implements Session {
  private readonly client: BridgeClient;
  private readonly stateListeners = new Set<Listener<SessionState>>();
  private readonly clockListeners = new Set<Listener<ClockState>>();
  private readonly events = new Set<Listener<SessionEvent>>();
  private state: SessionState;
  private snapshot?: BridgeSnapshot;
  private confirmedSnapshot?: BridgeSnapshot;
  private eventBaseline?: SessionState;
  private pendingEvents: BridgeEvent[] = [];
  private clock?: ClockState;
  private frame?: number;

  constructor(private readonly endpoint: string) {
    this.state = emptyState(endpoint);
    this.client = new BridgeClient(endpoint, {
      onStatus: (status, message = '') => {
        if (status === 'connected' || (this.state.status === status && this.state.message === message)) return;
        this.clearSnapshot();
        this.setState(emptyState(endpoint, status, message));
        this.publishClock();
      },
      onEvent: event => {
        this.eventBaseline ??= this.state;
        this.pendingEvents.push(event);
      },
      onSnapshot: snapshot => this.accept(snapshot),
    });
  }

  getState() { return this.state; }
  getClock() { return bridgeClock(this.state, this.snapshot, performance.now()); }
  subscribeState(callback: Listener<SessionState>) { return this.listen(this.stateListeners, callback, this.state); }
  subscribeClock(callback: Listener<ClockState>) { return this.listen(this.clockListeners, callback, this.getClock()); }
  on<T extends SessionEventType>(type: T, callback: Listener<Extract<SessionEvent, { type: T }>>) {
    return this.listen(this.events, event => {
      if (event.type === type) callback(event as Extract<SessionEvent, { type: T }>);
    });
  }

  private listen<T>(listeners: Set<Listener<T>>, callback: Listener<T>, initial?: T): Unsubscribe {
    const listener: Listener<T> = value => callback(value);
    listeners.add(listener);
    activeSessions.add(this);
    if (initial !== undefined) notify(listener, initial);
    this.start();
    this.scheduleFrame();
    return () => {
      if (!listeners.delete(listener)) return;
      if (!this.clockListeners.size) this.cancelFrame();
      if (!this.stateListeners.size && !this.clockListeners.size && !this.events.size) {
        activeSessions.delete(this);
        this.stop();
      }
    };
  }

  start() { if (!suspended) this.client.start(); }
  stop() {
    this.client.stop();
    this.clearSnapshot();
    this.setState(emptyState(this.endpoint));
    this.publishClock();
  }

  private clearSnapshot() {
    this.snapshot = undefined;
    this.confirmedSnapshot = undefined;
    this.eventBaseline = undefined;
    this.pendingEvents = [];
    this.cancelFrame();
  }

  private accept(snapshot: BridgeSnapshot) {
    this.snapshot = snapshot;
    if (snapshot.timer.phase !== 'running' && this.frame !== undefined) this.cancelFrame();
    let events: SessionEvent[] = [];
    if (snapshot.attemptFresh) {
      const previous = this.confirmedSnapshot ? { snapshot: this.confirmedSnapshot, state: this.state } : undefined;
      const state = bridgeState(this.endpoint, snapshot, previous);
      this.confirmedSnapshot = snapshot;
      if (this.eventBaseline) events = operationEvents(this.eventBaseline, state, this.pendingEvents);
      this.eventBaseline = undefined;
      this.pendingEvents = [];
      this.setState(state);
    }
    if (this.snapshot !== snapshot) return;
    this.publishClock();
    for (const event of events) {
      if (this.snapshot !== snapshot) break;
      publish(this.events, event);
    }
    this.scheduleFrame();
  }

  private setState(state: SessionState) {
    if (state === this.state) return;
    this.state = state;
    publish(this.stateListeners, state);
  }

  private publishClock(now = performance.now()) {
    if (!this.clockListeners.size) return;
    const next = bridgeClock(this.state, this.snapshot, now);
    const old = this.clock;
    if (old && next.realTime === old.realTime && next.gameTime === old.gameTime && next.phase === old.phase
      && next.splitIndex === old.splitIndex && next.timingMethod === old.timingMethod && next.gameTimePaused === old.gameTimePaused) return;
    this.clock = next;
    publish(this.clockListeners, next);
  }

  private scheduleFrame() {
    if (this.frame !== undefined || !this.clockListeners.size || this.snapshot?.timer.phase !== 'running') return;
    if (performance.now() - this.snapshot.timerAt >= 2000) return;
    this.frame = window.requestAnimationFrame(now => {
      this.frame = undefined;
      this.publishClock(now);
      this.scheduleFrame();
    });
  }

  private cancelFrame() {
    if (this.frame !== undefined) window.cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.clock = undefined;
  }
}

const sessions = new Map<string, Session>();
const activeSessions = new Set<SharedSession>();
let suspended = false;

/** All components and JavaScript consumers of an endpoint share its connection. */
export function getSession(server?: string): Session {
  const endpoint = getEndpoint(server === undefined ? window.location.search : `?server=${encodeURIComponent(server)}`);
  let session = sessions.get(endpoint);
  if (!session) { session = new SharedSession(endpoint); sessions.set(endpoint, session); }
  return session;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    suspended = true;
    for (const session of activeSessions) session.stop();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    for (const session of activeSessions) session.start();
  });
}
