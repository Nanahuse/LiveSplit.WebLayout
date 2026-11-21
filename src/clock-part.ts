import { AsyncDirective, directive } from 'lit-html/async-directive.js';
import type { Part } from 'lit-html/async-directive.js';
import type { ClockState } from './bridge-state.ts';
import type { Session } from './session.ts';

// A clock update commits only to the expression that requested it.
class ClockPart extends AsyncDirective {
  private session?: Session;
  private read?: (clock: ClockState) => unknown;
  private unsubscribe?: () => void;

  render(session: Session, read: (clock: ClockState) => unknown) {
    return read(session.getClock());
  }

  override update(_part: Part, [session, read]: Parameters<ClockPart['render']>) {
    this.read = read;
    if (this.session !== session) {
      this.disconnected();
      this.session = session;
    }
    if (this.isConnected && !this.unsubscribe) this.reconnected();
    return this.render(session, read);
  }

  protected override disconnected() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  protected override reconnected() {
    let initial = true;
    this.unsubscribe = this.session?.subscribeClock(clock => {
      if (!initial) this.setValue(this.read?.(clock));
    });
    initial = false;
  }
}

export const watchClock = directive(ClockPart);
