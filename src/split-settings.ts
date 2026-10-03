export const splitDefaults = {
  VisualSplitCount: 8, SplitPreviewCount: 1, AlwaysShowLastSplit: true,
  ShowBlankSplits: true, LockLastSplit: true, SeparatorLastSplit: true,
  ShowThinSeparators: true, ShowColumnLabels: false, Display2Rows: false,
  SplitTimesAccuracy: 'Seconds', DeltasAccuracy: 'Tenths', DropDecimals: true,
};
export type SplitSettings = typeof splitDefaults;
export function nativeSettings(root: Element): Record<string, unknown> {
  const raw: unknown = JSON.parse(root.getAttribute('settings') ?? '{}');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('settings must be an object');
  return raw as Record<string, unknown>;
}
export function splitSettings(root: Element): SplitSettings {
  const raw = nativeSettings(root);
  const settings = { ...splitDefaults };
  const unsupported = Object.keys(raw).filter(key => key !== 'Columns' && !(key in settings));
  if (unsupported.length) throw new Error(`未対応のSplits設定: ${unsupported.join(', ')}`);
  for (const key of Object.keys(settings) as (keyof SplitSettings)[]) {
    if (!(key in raw)) continue;
    if (typeof raw[key] !== typeof settings[key]) throw new Error(`Invalid ${key}`);
    Object.assign(settings, { [key]: raw[key] });
  }
  const total = root.getAttribute('total-splits'), upcoming = root.getAttribute('upcoming-splits');
  if (total !== null) settings.VisualSplitCount = Number(total);
  if (upcoming !== null) settings.SplitPreviewCount = Number(upcoming);
  if (root.hasAttribute('always-show-last-split')) settings.AlwaysShowLastSplit = root.getAttribute('always-show-last-split') !== 'false';
  if (!Number.isInteger(settings.VisualSplitCount) || settings.VisualSplitCount < 1 || settings.VisualSplitCount > 1000) throw new Error('Invalid VisualSplitCount');
  if (!Number.isInteger(settings.SplitPreviewCount) || settings.SplitPreviewCount < 0) throw new Error('Invalid SplitPreviewCount');
  settings.SplitPreviewCount = Math.min(settings.SplitPreviewCount, Math.max(0, settings.VisualSplitCount - (settings.AlwaysShowLastSplit ? 2 : 1)));
  for (const accuracy of [settings.SplitTimesAccuracy, settings.DeltasAccuracy]) {
    if (!['Seconds', 'Tenths', 'Hundredths', 'Milliseconds'].includes(accuracy)) throw new Error('Invalid accuracy');
  }
  return settings;
}
export function splitNumber(value: number, delta: boolean, settings: SplitSettings): string {
  const accuracy = delta ? settings.DeltasAccuracy : settings.SplitTimesAccuracy;
  const digits = delta && settings.DropDecimals && Math.abs(value) >= 60 ? 0 : ['Seconds', 'Tenths', 'Hundredths', 'Milliseconds'].indexOf(accuracy);
  const units = Math.floor(Math.abs(value) * 10 ** digits + 1e-7);
  const seconds = Math.floor(units / 10 ** digits);
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60;
  const clock = hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : delta && minutes === 0 ? String(seconds) : `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  return `${value < 0 ? '-' : delta && value > 0 ? '+' : ''}${clock}${digits ? '.' + String(units % 10 ** digits).padStart(digits, '0') : ''}`;
}
