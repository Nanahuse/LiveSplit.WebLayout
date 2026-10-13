import { getEndpoint } from './timer.ts';
import { renderReadout } from './readout.ts';
import { subscribe } from './session.ts';
import type { Session } from './session.ts';
import { metrics, metricTemplate } from './metrics.ts';
import { columnsFor } from './columns.ts';
import { updateLiveSplits } from './split-view.ts';
import { renderSegmentMetrics } from './segment-metrics.ts';
import { splitSettings } from './split-settings.ts';
import { renderTimeSave, timeSaveSettings } from './time-save.ts';
import { renderRecordColors, validateRecordEffects } from './record-colors.ts';
import { layoutTemplates, configureLayout, detailedComparisons, renderDetailed, textVariables, renderText } from './layout-parts.ts';

const templates: Record<string, string> = {
  'livesplit-timer': '<span class="ls-timer" role="timer" aria-live="off"><span data-ls-field="whole">—:—</span><span class="ls-fraction" data-ls-field="fraction">.—</span></span>',
  'livesplit-game': '<div class="ls-game" data-ls-field="game">—</div><div class="ls-category" data-ls-field="category">—</div>',
  'livesplit-splits': '<table class="ls-splits" aria-label="Splits"><thead><tr data-ls-field="split-head"></tr></thead><tbody data-ls-field="splits"></tbody></table>',
  'livesplit-status': '<span data-ls-field="status" role="status">接続中</span>',
  'livesplit-value': '<span data-ls-value>—</span>',
  ...Object.fromEntries(Object.entries(metrics).map(([name, metric]) => [name, metricTemplate(metric)])),
  ...layoutTemplates,
};

// Light DOM allows ordinary CSS and user-supplied data-ls-field templates.
class LiveSplitPart extends HTMLElement {
  static observedAttributes = ['server', 'field', 'label', 'hide-label', 'comparisons', 'settings', 'columns', 'live-delta', 'total-splits', 'upcoming-splits', 'always-show-last-split', 'comparison1', 'comparison2', 'left', 'right', 'left-field', 'right-field', 'left-variable', 'right-variable', 'pb-effect', 'bs-effect'];
  private unsubscribe?: () => void;
  connectedCallback() {
    this.setAttribute('data-ls-part', '');
    if (this.localName in metrics && this.localName !== 'livesplit-hotkey-indicator') this.setAttribute('data-ls-metric', '');
    if (!this.children.length) this.innerHTML = templates[this.localName as keyof typeof templates];
    this.bind();
  }
  disconnectedCallback() { this.unsubscribe?.(); this.unsubscribe = undefined; }
  attributeChangedCallback(name: string) {
    if (!this.isConnected) return;
    if (name === 'label' || name === 'hide-label') this.updateLabel();
    else this.bind();
  }
  private updateLabel() {
    const definition = metrics[this.localName as keyof typeof metrics];
    for (const label of this.querySelectorAll<HTMLElement>('.ls-label')) {
      label.hidden = this.hasAttribute('hide-label');
      if (this.hasAttribute('label')) label.textContent = this.getAttribute('label');
      else if (definition && !label.hasAttribute('data-ls-field')) label.textContent = definition.label;
    }
  }
  private bind() {
    const previousSubscription = this.unsubscribe;
    this.unsubscribe = undefined;
    for (const list of this.querySelectorAll<HTMLElement>('[data-ls-field="splits"]')) delete list.dataset.signature;
    const value = this.querySelector<HTMLElement>('[data-ls-value]');
    if (value) value.dataset.lsField = this.getAttribute('field') ?? 'phase';
    try {
      validateRecordEffects(this);
      configureLayout(this);
      if (['livesplit-previous-segment', 'livesplit-possible-time-save'].includes(this.localName)) timeSaveSettings(this);
      if ((this.localName === 'livesplit-text' && !this.querySelector('[data-ls-field], [data-ls-variable]'))) {
        this.dataset.state = 'static'; return;
      }
      const server = this.getAttribute('server');
      if (location.protocol === 'file:') throw new Error('Bridge v3はfile://に接続を許可しません。localhostのHTTPサーバーで開いてください。');
      const endpoint = getEndpoint(server === null ? location.search : `?server=${encodeURIComponent(server)}`);
      if (this.localName === 'livesplit-splits') splitSettings(this);
      // Validate settings; Bridge supplies all comparisons and variables together.
      if (this.localName === 'livesplit-splits') columnsFor(this);
      if (this.localName === 'livesplit-detailed-timer') detailedComparisons(this);
      textVariables(this);
      this.unsubscribe = subscribe(endpoint, (session, tick) => this.render(session, tick));
    } catch (error) {
      this.dataset.state = 'error';
      for (const element of this.querySelectorAll('[data-ls-field], [data-ls-variable], [data-text-side]')) element.textContent = `設定エラー: ${error instanceof Error ? error.message : '接続先・列設定を確認してください'}`;
    } finally { previousSubscription?.(); }
  }
  private render(session: Session, tick: boolean) {
    this.dataset.state = session.status;
    this.dataset.connectionMessage = session.message;
    const set = (field: string, value: string) => {
      for (const element of this.querySelectorAll(`[data-ls-field="${field}"]`)) element.textContent = value;
    };
    set('whole', session.time.whole); set('fraction', session.time.fraction);
    set('time', `${session.time.whole}${session.time.fraction}`);
    renderSegmentMetrics(session.run, this);
    renderDetailed(session.run, this);
    renderText(session.run, this);
    for (const cell of this.querySelectorAll('[data-live]')) cell.textContent = session.run.liveTime;
    if (tick) { updateLiveSplits(session.run, this); renderRecordColors(session.run, this, session.status === 'connected'); renderTimeSave(session.run, this, session.status === 'connected'); return; }
    set('status', { connecting: '接続中', connected: '接続済み', disconnected: '再接続待ち' }[session.status]);
    set('endpoint', session.endpoint);
    renderReadout(session.run, this);
    if (session.message) set('status', `再接続待ち: ${session.message}`);
    this.updateLabel();
    renderRecordColors(session.run, this, session.status === 'connected');
    renderTimeSave(session.run, this, session.status === 'connected');
  }
}
for (const name of Object.keys(templates)) {
  if (!customElements.get(name)) customElements.define(name, class extends LiveSplitPart {});
}
