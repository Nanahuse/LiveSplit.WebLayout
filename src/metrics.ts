// Dedicated tags share the same field bindings as livesplit-value.
export const metrics = {
  'livesplit-hotkey-indicator': { field: 'hotkey-status', label: 'Global Hotkeys' },
  'livesplit-segment-timer': { field: 'segment-time', label: '区間タイマー' },
  'livesplit-previous-segment': { field: 'previous-segment-delta', label: 'Previous Segment' },
  'livesplit-previous-segment-time': { field: 'previous-segment-time', label: '直前の区間タイム' },
  'livesplit-possible-time-save': { field: 'possible-time-save', label: 'Possible Time Save' },
  'livesplit-live-segment': { field: 'live-segment-delta', label: '現在区間の差分' },
  'livesplit-current-pace': { field: 'current-pace', label: 'Current Pace' },
  'livesplit-sum-of-best': { field: 'sum-of-best', label: 'Sum of Best' },
  'livesplit-real-time': { field: 'real-time', label: 'Real Time' },
  'livesplit-game-time': { field: 'game-time', label: 'Game Time' },
  'livesplit-best-possible-time': { field: 'best-possible', label: 'Best Possible Time' },
  'livesplit-delta': { field: 'delta', label: '比較との差' },
  'livesplit-previous-split': { field: 'last-split', label: '直前の累積タイム' },
  'livesplit-comparison-time': { field: 'split-target', label: '現在区間の比較累積タイム' },
  'livesplit-final-time': { field: 'final-time', label: '比較の最終タイム', labelField: 'final-label' },
  'livesplit-current-split': { field: 'current-split', label: '現在の区間' },
  'livesplit-previous-split-name': { field: 'previous-split', label: '直前の区間' },
  'livesplit-split-progress': { field: 'split-progress', label: '区間進捗' },
  'livesplit-attempts': { field: 'attempts', label: '挑戦回数' },
  'livesplit-completed-attempts': { field: 'completed', label: '完走回数' },
  'livesplit-phase': { field: 'phase', label: '走行状態' },
  'livesplit-comparison': { field: 'comparison', label: '比較対象' },
  'livesplit-timing-method': { field: 'method', label: '計測方法' },
} satisfies Record<string, { field: string; label: string; labelField?: string }>;

export function metricTemplate(metric: { field: string; label: string; labelField?: string }): string {
  return `<span class="ls-label"${metric.labelField ? ` data-ls-field="${metric.labelField}"` : ''}>${metric.label}</span><span class="ls-value" data-ls-field="${metric.field}">—</span>`;
}
