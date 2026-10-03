import type { RunReadout } from './readout.ts';
import { formatDelta } from './splits.ts';

export const layoutTemplates: Record<string, string> = {
  'livesplit-detailed-timer': '<div class="ls-detailed"><div class="ls-timer" role="timer"><span data-ls-field="whole">—:—</span><span class="ls-fraction" data-ls-field="fraction">.—</span></div><div class="ls-segment-name" data-ls-field="current-split">—</div><div class="ls-segment-time" data-ls-field="segment-time">—</div><dl class="ls-comparison-times"><div><dt data-comparison-label="1"></dt><dd data-comparison-value="1">—</dd></div><div><dt data-comparison-label="2"></dt><dd data-comparison-value="2">—</dd></div></dl></div>',
  'livesplit-text': '<div class="ls-text"><span data-text-side="left"></span><span data-text-side="right"></span></div>',
};
export function detailedComparisons(root: Element): string[] {
  return [root.getAttribute('comparison1') ?? 'Personal Best', root.getAttribute('comparison2') ?? 'Best Segments']
    .map(name => name === 'Current Comparison' ? '' : name)
    .map(name => { if (/[\r\n\0]/.test(name)) throw new Error('Invalid comparison'); return name; });
}
export function configureLayout(root: HTMLElement) {
  if (root.localName === 'livesplit-text') {
    for (const side of ['left', 'right']) {
      const element = root.querySelector<HTMLElement>(`[data-text-side="${side}"]`);
      if (!element) continue;
      const variable = root.getAttribute(`${side}-variable`);
      delete element.dataset.lsVariable;
      if (variable !== null) {
        if (!variable.trim() || /[\r\n\0]/.test(variable)) throw new Error('Invalid custom variable name');
        delete element.dataset.lsField; element.dataset.lsVariable = variable; element.textContent = '—'; continue;
      }
      const field = root.getAttribute(`${side}-field`);
      if (field && /^[a-z-]+$/.test(field)) element.dataset.lsField = field;
      else { delete element.dataset.lsField; element.textContent = root.getAttribute(side) ?? ''; }
    }
  }

}
export function renderDetailed(run: RunReadout, root: HTMLElement) {
  if (root.localName !== 'livesplit-detailed-timer') return;
  const index = run.history.phase === 'Ended' ? run.history.index - 1 : run.history.index;
  detailedComparisons(root).forEach((comparison, i) => {
    const label = root.querySelector(`[data-comparison-label="${i + 1}"]`);
    const element = root.querySelector(`[data-comparison-value="${i + 1}"]`);
    if (label) label.textContent = comparison || run.values.get('getcomparisonname') || 'Current Comparison';
    // The two reference rows remain comparison segment times even after finish.
    const snapshot = run.comparisons.rows.get(index)?.get(comparison);
    const previous = index === 0 ? 0 : run.comparisons.rows.get(index - 1)?.get(comparison)?.target
      ?? (snapshot?.previousTime != null && snapshot.previousDelta != null ? snapshot.previousTime - snapshot.previousDelta : null);
    const value = snapshot?.target != null && previous != null ? snapshot.target - previous : null;
    if (element) element.textContent = value === null ? '—' : formatDelta(value).replace(/^\+/, '');
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
