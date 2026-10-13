import type { RunReadout } from './readout.ts';
import { presentation, clockParts } from './presentation-settings.ts';
import { segmentMetrics } from './segment-metrics.ts';
import { liveSeconds } from './columns.ts';

export const layoutTemplates: Record<string, string> = {
  'livesplit-hotkey-indicator': '<span class="ls-hotkey-bar" aria-hidden="true"></span><span class="ls-label">Global Hotkeys</span><span class="ls-value" data-ls-field="hotkey-status" role="status">—</span>',
  'livesplit-detailed-timer': '<div class="ls-detailed"><div class="ls-timer" role="timer"><span data-ls-field="whole">—:—</span><span class="ls-fraction" data-ls-field="fraction">.—</span></div><div class="ls-segment-name" data-ls-field="current-split">—</div><div class="ls-segment-time"><span data-segment-whole>—</span><span class="ls-segment-fraction" data-segment-fraction></span></div><dl class="ls-comparison-times"><div><dt data-comparison-label="1"></dt><dd data-comparison-value="1">—</dd></div><div><dt data-comparison-label="2"></dt><dd data-comparison-value="2">—</dd></div></dl></div>',
  'livesplit-text': '<div class="ls-text"><span data-text-side="left"></span><span data-text-side="right"></span></div>',
};
export function detailedComparisons(root: Element): string[] {
  const settings = presentation(root);
  return [root.getAttribute('comparison1') ?? settings.Comparison, root.getAttribute('comparison2') ?? settings.Comparison2]
    .map(name => name === 'Current Comparison' ? '' : name)
    .map(name => { if (/[\r\n\0]/.test(name)) throw new Error('Invalid comparison'); return name; });
}
export function configureLayout(root: HTMLElement) {
  if (!['livesplit-text', 'livesplit-detailed-timer', 'livesplit-hotkey-indicator'].includes(root.localName)) return;
  const settings = presentation(root);
  if (root.localName === 'livesplit-hotkey-indicator') {
    root.style.setProperty('--ls-setting-hotkey-height', `${settings.IndicatorHeight}px`);
    root.style.setProperty('--ls-setting-hotkey-width', `${settings.IndicatorWidth}px`);
    root.style.setProperty('--ls-setting-hotkey-on', settings.HotkeysOnColor);
    root.style.setProperty('--ls-setting-hotkey-off', settings.HotkeysOffColor);
  }
  if (root.localName === 'livesplit-detailed-timer') {
    const name = root.querySelector<HTMLElement>('.ls-segment-name'); if (name) name.hidden = !settings.ShowSplitName;
    const second = root.querySelector<HTMLElement>('[data-comparison-value="2"]')?.parentElement; if (second) second.hidden = settings.HideComparison;
    root.style.setProperty('--ls-setting-segment-ratio', `${settings.SegmentTimerSizeRatio / 100}`);
    root.style.setProperty('--ls-setting-decimal-size', `${settings.DecimalsSize / 100}em`);
    root.style.setProperty('--ls-setting-segment-decimal-size', `${settings.SegmentTimerDecimalsSize / 100}em`);
  }
  if (root.localName === 'livesplit-text') {
    root.dataset.twoRows = String(settings.Display2Rows);
    for (const side of ['left', 'right']) {
      const element = root.querySelector<HTMLElement>(`[data-text-side="${side}"]`);
      if (!element) continue;
      const literal = root.getAttribute(side) ?? (side === 'left' ? settings.Text1 : settings.Text2);
      const variable = root.getAttribute(`${side}-variable`) ?? (side === 'right' && settings.CustomVariable ? literal : null);
      delete element.dataset.lsVariable;
      if (variable !== null) {
        if (!variable.trim() || /[\r\n\0]/.test(variable)) throw new Error('Invalid custom variable name');
        delete element.dataset.lsField; element.dataset.lsVariable = variable; element.textContent = '—'; continue;
      }
      const field = root.getAttribute(`${side}-field`);
      if (field && /^[a-z-]+$/.test(field)) element.dataset.lsField = field;
      else { delete element.dataset.lsField; element.textContent = literal; }
    }
  }

}
export function renderDetailed(run: RunReadout, root: HTMLElement) {
  if (root.localName !== 'livesplit-detailed-timer') return;
  const settings = presentation(root);
  const writeClock = (value: number | null, digits: string, accuracy: string, whole: string, fraction: string) => {
    const time = clockParts(value, digits, accuracy);
    const w = root.querySelector(whole), f = root.querySelector(fraction);
    if (w) w.textContent = time.whole; if (f) f.textContent = time.fraction;
  };
  writeClock(liveSeconds(run.liveTime), settings.DigitsFormat, settings.Accuracy, '[data-ls-field="whole"]', '[data-ls-field="fraction"]');
  writeClock(segmentMetrics(run).segment, settings.SegmentDigitsFormat, settings.SegmentAccuracy, '[data-segment-whole]', '[data-segment-fraction]');
  const index = run.referenceIndex;
  detailedComparisons(root).forEach((comparison, i) => {
    const label = root.querySelector(`[data-comparison-label="${i + 1}"]`);
    const element = root.querySelector(`[data-comparison-value="${i + 1}"]`);
    if (label) label.textContent = comparison || run.values.get('getcomparisonname') || 'Current Comparison';
    // The two reference rows remain comparison segment times even after finish.
    const snapshot = run.comparisons.rows.get(index)?.get(comparison);
    const value = (comparison || run.values.get('getcomparisonname')) === 'Best Segments'
      ? run.bestSegments.get(index) ?? null
      : snapshot?.segmentTarget ?? null;
    const time = clockParts(value, '1:23', { Seconds: '', Tenths: '.2', Hundredths: '.23' }[settings.SegmentTimesAccuracy]!);
    if (element) element.textContent = time.whole + time.fraction;
  });
}

export function textVariables(root: HTMLElement): string[] {
  const names = [...new Set([...root.querySelectorAll<HTMLElement>('[data-ls-variable]')].map(e => e.dataset.lsVariable!))];
  if (names.some(name => !name.trim() || /[\r\n\0]/.test(name))) throw new Error('Invalid custom variable name');
  return names;
}
export function renderText(run: RunReadout, root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>('[data-ls-variable]')) {
    element.textContent = run.values.get(`getcustomvariablevalue ${element.dataset.lsVariable}`) ?? '—';
  }
}
