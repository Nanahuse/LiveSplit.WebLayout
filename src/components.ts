import { getEndpoint } from './timer.ts';
import { renderReadout } from './readout.ts';
import { subscribe } from './session.ts';
import type { Session } from './session.ts';

const templates = {
  'livesplit-timer': '<span class="ls-timer" role="timer" aria-live="off"><span data-ls-field="whole">—:—</span><span class="ls-fraction" data-ls-field="fraction">.—</span></span>',
  'livesplit-game': '<div class="ls-game" data-ls-field="game">—</div><div class="ls-category" data-ls-field="category">—</div>',
  'livesplit-splits': '<table class="ls-splits" aria-label="Splits"><thead><tr><th scope="col">区間</th><th scope="col">比較差</th><th scope="col">累積タイム</th></tr></thead><tbody data-ls-field="splits"></tbody></table>',
  'livesplit-status': '<span data-ls-field="status" role="status">接続中</span>',
  'livesplit-value': '<span data-ls-value>—</span>',
} as const;

// Light DOM allows ordinary CSS and user-supplied data-ls-field templates.
class LiveSplitPart extends HTMLElement {
  static observedAttributes = ['server', 'field'];
  private unsubscribe?: () => void;
  connectedCallback() {
    if (!this.children.length) this.innerHTML = templates[this.localName as keyof typeof templates];
    this.bind();
  }
  disconnectedCallback() { this.unsubscribe?.(); this.unsubscribe = undefined; }
  attributeChangedCallback() { if (this.isConnected) this.bind(); }
  private bind() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    for (const list of this.querySelectorAll<HTMLElement>('[data-ls-field="splits"]')) delete list.dataset.signature;
    const value = this.querySelector<HTMLElement>('[data-ls-value]');
    if (value) value.dataset.lsField = this.getAttribute('field') ?? 'phase';
    try {
      const server = this.getAttribute('server');
      const endpoint = getEndpoint(server === null ? location.search : `?server=${encodeURIComponent(server)}`);
      this.unsubscribe = subscribe(endpoint, (session, tick) => this.render(session, tick));
    } catch {
      this.dataset.state = 'error';
      for (const element of this.querySelectorAll('[data-ls-field]')) element.textContent = '接続先エラー';
    }
  }
  private render(session: Session, tick: boolean) {
    this.dataset.state = session.status;
    const set = (field: string, value: string) => {
      for (const element of this.querySelectorAll(`[data-ls-field="${field}"]`)) element.textContent = value;
    };
    set('whole', session.time.whole); set('fraction', session.time.fraction);
    set('time', `${session.time.whole}${session.time.fraction}`);
    for (const cell of this.querySelectorAll('[data-live]')) cell.textContent = session.run.liveTime;
    if (tick) return;
    set('status', { connecting: '接続中', connected: '接続済み', disconnected: '再接続待ち' }[session.status]);
    set('endpoint', session.endpoint);
    renderReadout(session.run, this);
  }
}
for (const name of Object.keys(templates)) {
  if (!customElements.get(name)) customElements.define(name, class extends LiveSplitPart {});
}
