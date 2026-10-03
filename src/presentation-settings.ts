import { nativeSettings } from './split-settings.ts';

const detailedDefaults = {
  Comparison: 'Current Comparison', Comparison2: 'Best Segments', HideComparison: false,
  ShowSplitName: false, DigitsFormat: '1', Accuracy: '.23', SegmentDigitsFormat: '1',
  SegmentAccuracy: '.23', SegmentTimesAccuracy: 'Hundredths', SegmentTimerSizeRatio: 40,
  DecimalsSize: 35, SegmentTimerDecimalsSize: 35,
};
const textDefaults = { Text1: '', Text2: '', CustomVariable: false, Display2Rows: false };
const hotkeyDefaults = { IndicatorHeight: 3, IndicatorWidth: 3, HotkeysOnColor: '#29cc54', HotkeysOffColor: '#cc3729' };
export type Presentation = typeof detailedDefaults & typeof textDefaults & typeof hotkeyDefaults;
const cache = new WeakMap<Element, { raw: string | null; value: Presentation }>();
export function presentation(root: Element): Presentation {
  const raw = root.getAttribute('settings');
  const old = cache.get(root);
  if (old?.raw === raw) return old.value;
  const defaults = root.localName === 'livesplit-text' ? textDefaults : root.localName === 'livesplit-hotkey-indicator' ? hotkeyDefaults : detailedDefaults;
  const input = nativeSettings(root);
  for (const [key, value] of Object.entries(input)) {
    if (!(key in defaults)) throw new Error(`未対応の表示設定: ${key}（装飾はCSSで指定）`);
    if (typeof value !== typeof defaults[key as keyof typeof defaults]) throw new Error(`Invalid ${key}`);
  }
  const value = { ...detailedDefaults, ...textDefaults, ...hotkeyDefaults, ...input } as Presentation;
  for (const key of ['DigitsFormat', 'SegmentDigitsFormat'] as const) {
    if (!['1', '1:23', '1:23:45'].includes(value[key])) throw new Error(`Invalid ${key}`);
  }
  for (const key of ['Accuracy', 'SegmentAccuracy'] as const) {
    if (!['', '.2', '.23'].includes(value[key])) throw new Error(`Invalid ${key}: maximum accuracy is hundredths`);
  }
  if (!['Seconds', 'Tenths', 'Hundredths'].includes(value.SegmentTimesAccuracy)) throw new Error('Invalid SegmentTimesAccuracy');
  for (const key of ['SegmentTimerSizeRatio', 'DecimalsSize', 'SegmentTimerDecimalsSize', 'IndicatorHeight', 'IndicatorWidth'] as const) {
    if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 1000) throw new Error(`Invalid ${key}`);
  }
  cache.set(root, { raw, value }); return value;
}

// Truncate instead of rounding a running clock ahead of LiveSplit.
export function clockParts(value: number | null, digits: string, accuracy: string) {
  if (value === null || !Number.isFinite(value)) return { whole: '—', fraction: '' };
  const total = Math.floor(Math.abs(value) * 100 + 1e-7);
  const seconds = Math.floor(total / 100), minutes = Math.floor(seconds / 60), hours = Math.floor(minutes / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const whole = digits === '1:23:45' || hours > 0 ? `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`
    : digits === '1:23' || minutes > 0 ? `${minutes}:${pad(seconds % 60)}` : String(seconds);
  return { whole: `${value < 0 ? '-' : ''}${whole}`, fraction: accuracy ? `.${pad(total % 100).slice(0, accuracy.length - 1)}` : '' };
}
