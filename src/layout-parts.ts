import { html } from 'lit-html';
import { styleMap } from 'lit-html/directives/style-map.js';
import type { ClockState, SessionState } from './bridge-state.ts';
import { watchClock } from './clock-part.ts';
import { fieldUsesClock, fieldValue } from './metrics.ts';
import { presentation } from './presentation-settings.ts';
import { clockParts } from './timer.ts';
import { clockTime, readout, own, segmentMetrics, splitSummary } from './readout.ts';
import { timerColor } from './record-colors.ts';
import type { RecordEffect } from './record-colors.ts';
import type { Session } from './session.ts';

export function detailedTimerView(root: Element, pbEffect: RecordEffect) {
  const settings = presentation(root);
  const comparisons = [settings.Comparison, settings.Comparison2].map(name => {
    if (/[\r\n\0]/.test(name)) throw new Error('Invalid comparison');
    return name === 'Current Comparison' ? '' : name;
  });
  const sizes = styleMap({
    '--ls-setting-segment-ratio': String(settings.SegmentTimerSizeRatio / 100),
    '--ls-setting-decimal-size': `${settings.DecimalsSize / 100}em`,
    '--ls-setting-segment-decimal-size': `${settings.SegmentTimerDecimalsSize / 100}em`,
  });
  return (state: SessionState, session?: Session) => {
    const run = readout(state);
    const name = splitSummary(run).current;
    const clocks = (clock?: ClockState) => {
      const now = clockTime(run, clock);
      const color = timerColor(run, now);
      const record = color === 'pb' ? 'pb' : '';
      const effect = record ? pbEffect : 'none';
      const time = clockParts(clock?.[clock.timingMethod] ?? null, settings.DigitsFormat, settings.Accuracy);
      const segment = clockParts(segmentMetrics(run, now).segment, settings.SegmentDigitsFormat, settings.SegmentAccuracy);
      return html`<div class="ls-timer" role="timer" aria-live="off" data-timer-color=${color} data-record=${record} data-record-effect=${effect}><span>${time.whole}</span><span class="ls-fraction">${time.fraction}</span></div>
        <div class="ls-segment-name" ?hidden=${!settings.ShowSplitName}>${name}</div>
        <div class="ls-segment-time" data-timer-color=${color} data-record=${record} data-record-effect=${effect}><span>${segment.whole}</span><span class="ls-segment-fraction">${segment.fraction}</span></div>`;
    };
    const index = run.referenceIndex;
    const references = comparisons.map((key, i) => {
      const label = key || run.comparison || 'Current Comparison';
      const value = label === 'Best Segments' ? run.bestSegments.get(index) ?? null
        : run.comparisons.rows.get(index)?.get(key)?.segmentTarget ?? null;
      const accuracy = { Seconds: '', Tenths: '.2', Hundredths: '.23' }[settings.SegmentTimesAccuracy]!;
      const time = clockParts(value, '1:23', accuracy);
      return html`<div ?hidden=${i === 1 && settings.HideComparison}><dt>${label}</dt><dd>${time.whole + time.fraction}</dd></div>`;
    });
    return html`<div class="ls-detailed" style=${sizes}>
      ${session ? watchClock(session, clocks) : clocks()}
      <dl class="ls-comparison-times">${references}</dl>
    </div>`;
  };
}

export function textView(root: HTMLElement) {
  const settings = presentation(root);
  root.dataset.twoRows = String(settings.Display2Rows);
  const sides = (['left', 'right'] as const).map(side => {
    const literal = root.getAttribute(side) ?? (side === 'left' ? settings.Text1 : settings.Text2);
    const variable = root.getAttribute(`${side}-variable`) ?? (side === 'right' && settings.CustomVariable ? literal : null);
    if (variable !== null && (!variable.trim() || /[\r\n\0]/.test(variable))) throw new Error('Invalid custom variable name');
    return { side, literal, variable, field: variable === null ? root.getAttribute(`${side}-field`) : null };
  });
  return {
    static: sides.every(side => side.field === null && side.variable === null),
    view: (state: SessionState, session?: Session) => html`<div class="ls-text">${sides.map(({ side, literal, variable, field }) => {
      const value = field !== null
        ? session && fieldUsesClock(field) ? watchClock(session, clock => fieldValue(field, state, clock).text) : fieldValue(field, state).text
        : variable !== null ? own(state.context?.variables, variable) ?? '—' : literal;
      return html`<span data-text-side=${side}>${value}</span>`;
    })}</div>`,
  };
}

export function hotkeyView(root: Element) {
  const settings = presentation(root);
  const style = styleMap({
    '--ls-setting-hotkey-height': `${settings.IndicatorHeight}px`,
    '--ls-setting-hotkey-width': `${settings.IndicatorWidth}px`,
    '--ls-setting-hotkey-on': settings.HotkeysOnColor,
    '--ls-setting-hotkey-off': settings.HotkeysOffColor,
  });
  const label = root.getAttribute('label') ?? 'Global Hotkeys';
  const hidden = root.hasAttribute('hide-label');
  return () => html`<span class="ls-hotkey-bar" aria-hidden="true" data-hotkeys="unknown" style=${style}></span><span class="ls-label" ?hidden=${hidden}>${label}</span><span class="ls-value" role="status">取得不可</span>`;
}
