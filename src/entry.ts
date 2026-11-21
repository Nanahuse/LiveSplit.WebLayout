import './parts.css';
import './components.ts';
import { getSession } from './session.ts';
import { displayTime } from './readout.ts';

export type { Session } from './session.ts';
export type { ClockState, Phase, SessionState, TimingMethod, Times } from './bridge-state.ts';
export type { SessionEvent, SessionEventType, SplitResult } from './session-events.ts';

declare global {
  interface Window { LiveSplit: Readonly<{ getSession: typeof getSession; formatTime: typeof displayTime }>; }
}

window.LiveSplit = Object.freeze({ getSession, formatTime: displayTime });
