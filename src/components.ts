import { html, nothing, render } from 'lit-html';
import type { RootPart } from 'lit-html';
import { guard } from 'lit-html/directives/guard.js';
import { emptyState } from './bridge-state.ts';
import type { ClockState, SessionState } from './bridge-state.ts';
import { watchClock } from './clock-part.ts';
import { getSession } from './session.ts';
import type { Session } from './session.ts';
import { connectionText, fieldUsesClock, fieldValue, metrics } from './metrics.ts';
import { clockTime, displayClock, readout } from './readout.ts';
import { splitView, splitViewSettings } from './split-view.ts';
import { timeSaveDisplay, timeSaveSettings } from './time-save.ts';
import { recordEffect, timerColor } from './record-colors.ts';
import { detailedTimerView, hotkeyView, textView } from './layout-parts.ts';

type View = (state: SessionState, session?: Session) => unknown;
interface Metric { field: string; label: string; labelField?: string }
const metricTags: Readonly<Record<string, Metric>> = metrics;
const tags = [
  'livesplit-timer', 'livesplit-game', 'livesplit-splits', 'livesplit-subsplits', 'livesplit-status',
  'livesplit-value', 'livesplit-detailed-timer', 'livesplit-text', 'livesplit-hotkey-indicator',
  ...Object.keys(metricTags),
];

function viewFor(root: HTMLElement): { view: View; static?: boolean } {
  const pbEffect = recordEffect(root, 'pb-effect');
  const bsEffect = recordEffect(root, 'bs-effect');
  const label = root.getAttribute('label');
  const hideLabel = root.hasAttribute('hide-label');

  switch (root.localName) {
    case 'livesplit-timer':
      return { view: (state, session) => {
        const run = readout(state);
        const timer = (clock?: ClockState) => {
          const { whole, fraction } = displayClock(clock?.[clock.timingMethod] ?? null);
          const color = timerColor(run, clockTime(run, clock));
          const pb = color === 'pb';
          return html`<span class="ls-timer" role="timer" aria-live="off" data-timer-color=${color}
            data-record=${pb ? 'pb' : ''} data-record-effect=${pb ? pbEffect : 'none'}><span>${whole}</span><span class="ls-fraction">${fraction}</span></span>`;
        };
        return session ? watchClock(session, timer) : timer();
      } };
    case 'livesplit-game':
      return { view: state => html`<div class="ls-game">${fieldValue('game', state).text}</div><div class="ls-category">${fieldValue('category', state).text}</div>` };
    case 'livesplit-status':
      return { view: state => html`<span role="status">${connectionText(state)}</span>` };
    case 'livesplit-splits':
    case 'livesplit-subsplits': {
      const config = splitViewSettings(root, bsEffect);
      root.dataset.twoRows = String(config.settings.Display2Rows);
      root.dataset.separators = String(config.settings.ShowThinSeparators);
      return { view: (state, session) => guard(
        [config, session, state.run, state.context, state.attempt, state.phase, state.splitIndex],
        () => splitView(readout(state), config, session),
      ) };
    }
    case 'livesplit-detailed-timer': return { view: detailedTimerView(root, pbEffect) };
    case 'livesplit-text': return textView(root);
    case 'livesplit-hotkey-indicator': return { static: true, view: hotkeyView(root) };
    case 'livesplit-previous-segment':
    case 'livesplit-possible-time-save': {
      const settings = timeSaveSettings(root);
      const previous = root.localName === 'livesplit-previous-segment';
      root.dataset.twoRows = String(settings.Display2Rows);
      root.setAttribute('data-native-metric', '');
      return { view: (state, session) => {
        const run = readout(state);
        const display = timeSaveDisplay(run, settings, previous);
        const metric = (clock?: ClockState) => {
          const value = display(clockTime(run, clock));
          return html`<span class="ls-label" ?hidden=${hideLabel}>${label ?? value.label}</span><span class="ls-value" data-sign=${value.sign}
            data-record=${value.record} data-record-effect=${value.record ? bsEffect : 'none'}>${value.value}</span>`;
        };
        return (previous || settings.TotalTimeSave) && session ? watchClock(session, metric) : metric();
      } };
    }
  }

  const definition = metricTags[root.localName];
  const field = definition?.field ?? root.getAttribute('field') ?? 'phase';
  return { view: (state, session) => {
    const valueView = (clock?: ClockState) => {
      const value = fieldValue(field, state, clock);
      return html`<span class=${definition ? 'ls-value' : 'ls-unlabeled-value'} data-sign=${value.sign ?? nothing}
        data-timer-color=${value.color ?? nothing} data-record=${value.record ?? nothing}
        data-record-effect=${value.record === 'pb' ? pbEffect : value.record === 'bs' ? bsEffect : 'none'}>${value.text}</span>`;
    };
    const value = session && fieldUsesClock(field) ? watchClock(session, valueView) : valueView();
    return html`${definition ? html`<span class="ls-label" ?hidden=${hideLabel}>${label ?? (definition.labelField ? fieldValue(definition.labelField, state).text : definition.label)}</span>` : nothing}${value}`;
  } };
}

class LiveSplitPart extends HTMLElement {
  static observedAttributes = ['server', 'field', 'label', 'hide-label', 'settings', 'live-delta',
    'left', 'right', 'left-field', 'right-field', 'left-variable', 'right-variable', 'pb-effect', 'bs-effect'];

  private session?: Session;
  private unsubscribe?: () => void;
  private rootPart?: RootPart;
  private view?: View;

  connectedCallback() {
    this.setAttribute('data-ls-part', '');
    if (Object.hasOwn(metricTags, this.localName)) this.setAttribute('data-ls-metric', '');
    if (!this.rootPart && this.firstChild) this.textContent = '';
    this.configure();
    this.rootPart?.setConnected(true);
  }

  disconnectedCallback() {
    this.rootPart?.setConnected(false);
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.session = undefined;
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
    if (this.isConnected && oldValue !== newValue) this.configure();
  }

  private configure() {
    try {
      const { view, static: fixed } = viewFor(this);
      this.view = view;
      const session = fixed ? undefined : getSession(this.getAttribute('server') ?? undefined);
      if (session !== this.session) {
        const previous = this.unsubscribe;
        this.session = session;
        this.unsubscribe = session?.subscribeState(state => this.update(state));
        previous?.();
      } else if (session) this.update(session.getState());
      if (fixed) {
        this.dataset.state = 'static';
        delete this.dataset.connectionMessage;
        this.rootPart = render(view(emptyState('')), this);
      }
    } catch (error) {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.session = undefined;
      this.dataset.state = 'error';
      delete this.dataset.connectionMessage;
      this.rootPart = render(html`<span role="status">設定エラー: ${error instanceof Error ? error.message : String(error)}</span>`, this);
    }
  }

  private update(state: SessionState) {
    if (this.dataset.state !== state.status) this.dataset.state = state.status;
    if (this.dataset.connectionMessage !== state.message) this.dataset.connectionMessage = state.message;
    this.rootPart = render(this.view?.(state, this.session), this);
  }
}

for (const name of tags) {
  if (!customElements.get(name)) customElements.define(name, class extends LiveSplitPart {});
}
