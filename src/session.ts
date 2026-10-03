import { TimerConnection } from './timer.ts';
import type { ConnectionStatus, TimerDisplay } from './timer.ts';
import { RunReadout } from './readout.ts';
type Listener = (session: Session, tick: boolean) => void;
export class Session {
  readonly run = new RunReadout();
  status: ConnectionStatus = 'connecting';
  time: TimerDisplay = { whole: '—:—', fraction: '.—' };
  readonly listeners = new Set<Listener>();
  readonly comparisonRequests = new Map<Listener, string[]>();
  private readonly timer: TimerConnection;
  private readonly details: TimerConnection;
  constructor(readonly endpoint: string) {
    this.details = new TimerConnection(endpoint, {
      onTime() {}, onStatus() {}, interval: 33, timeout: 1000, retry: 250,
      readout: { nextCommand: () => this.run.nextCommand(), onResponse: (command, value) => {
        this.run.receive(command, value); this.emit(false);
      } },
    });
    this.timer = new TimerConnection(endpoint, {
      onTime: time => { this.time = time; this.run.liveTime = `${time.whole}${time.fraction}`; this.emit(true); },
      onStatus: status => {
        const changed = this.status !== status;
        this.status = status;
        if (status !== 'connected') {
          this.time = { whole: '—:—', fraction: '.—' }; this.details.stop(); this.run.clear();
        } else if (changed) this.details.start();
        if (changed || status !== 'connected') this.emit(false);
      },
    });
  }
  start() { this.timer.start(); }
  stop() { this.timer.stop(); this.details.stop(); this.run.clear(); this.status = 'connecting'; }
  private emit(tick: boolean) { for (const listener of this.listeners) listener(this, tick); }
}
const sessions = new Map<string, Session>();
export function subscribe(endpoint: string, listener: Listener, comparisons: string[] = []) {
  let session = sessions.get(endpoint);
  if (!session) { session = new Session(endpoint); sessions.set(endpoint, session); }
  session.comparisonRequests.set(listener, comparisons);
  session.run.comparisons.names = new Set([...session.comparisonRequests.values()].flat());
  session.listeners.add(listener); listener(session, false); session.start();
  return () => {
    session.listeners.delete(listener);
    session.comparisonRequests.delete(listener);
    session.run.comparisons.names = new Set([...session.comparisonRequests.values()].flat());
    if (!session.listeners.size) { session.stop(); sessions.delete(endpoint); }
  };
}
window.addEventListener('pagehide', () => { for (const session of sessions.values()) session.stop(); });
window.addEventListener('pageshow', () => { for (const session of sessions.values()) session.start(); });
