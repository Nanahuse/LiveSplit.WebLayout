import { BridgeClient } from './bridge-client.ts';
import type { BridgeSnapshot } from './bridge-client.ts';
import { applyBridgeSnapshot, updateBridgeClock } from './bridge-state.ts';
import type { ConnectionStatus, TimerDisplay } from './timer.ts';
import { RunReadout } from './readout.ts';
type Listener = (session: Session, tick: boolean) => void;
export class Session {
  readonly run = new RunReadout();
  status: ConnectionStatus = 'connecting';
  message = '';
  time: TimerDisplay = { whole: '—:—', fraction: '.—' };
  readonly listeners = new Set<Listener>();
  private readonly client: BridgeClient;
  private snapshot?: BridgeSnapshot;
  private frame?: number;
  constructor(readonly endpoint: string) {
    this.client = new BridgeClient(endpoint, {
      onStatus: (status, message) => {
        this.status = status; this.message = message ?? '';
        if (status !== 'connected') { this.snapshot = undefined; this.run.clear(); this.updateTime(); }
        this.emit(false);
      },
      onSnapshot: snapshot => {
        this.snapshot = snapshot; applyBridgeSnapshot(this.run, snapshot, performance.now());
        this.updateTime(); this.emit(false);
      },
    });
  }
  private updateTime() {
    const dot = this.run.liveTime.lastIndexOf('.');
    this.time = dot < 0 ? { whole: '—:—', fraction: '.—' } : { whole: this.run.liveTime.slice(0, dot), fraction: this.run.liveTime.slice(dot) };
  }
  start() {
    this.client.start();
    if (this.frame !== undefined) return;
    const tick = () => {
      if (this.snapshot && this.status === 'connected') { updateBridgeClock(this.run, this.snapshot, performance.now()); this.updateTime(); this.emit(true); }
      this.frame = window.requestAnimationFrame(tick);
    };
    this.frame = window.requestAnimationFrame(tick);
  }
  stop() { this.client.stop(); if (this.frame !== undefined) window.cancelAnimationFrame(this.frame); this.frame = undefined; this.snapshot = undefined; this.run.clear(); this.status = 'connecting'; }
  private emit(tick: boolean) { for (const listener of this.listeners) listener(this, tick); }
}
const sessions = new Map<string, Session>();
export function subscribe(endpoint: string, listener: Listener) {
  let session = sessions.get(endpoint);
  if (!session) { session = new Session(endpoint); sessions.set(endpoint, session); }
  session.listeners.add(listener); listener(session, false); session.start();
  return () => {
    session.listeners.delete(listener);
    if (!session.listeners.size) { session.stop(); sessions.delete(endpoint); }
  };
}
window.addEventListener('pagehide', () => { for (const session of sessions.values()) session.stop(); });
window.addEventListener('pageshow', () => { for (const session of sessions.values()) session.start(); });
