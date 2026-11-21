import type { ClockState, SessionState } from './bridge-state.ts';
import { clockTime, displayTime, displayClock, readout, segmentMetrics, splitSummary } from './readout.ts';
import { timerColor } from './record-colors.ts';
export const metrics = {
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

export function fieldUsesClock(field: string) {
  return ['time', 'whole', 'fraction', 'real-time', 'game-time', 'best-possible', 'segment-time', 'live-segment-delta'].includes(field);
}

export function connectionText({ status, message }: SessionState) {
  if (message) return `再接続待ち: ${message}`;
  return { connecting: '接続中', connected: '接続済み', disconnected: '再接続待ち' }[status];
}

export function fieldValue(field: string, state: SessionState, clock?: ClockState): { text: string; sign?: string; record?: string; color?: string } {
  switch (field) {
    case 'status': return { text: connectionText(state) };
    case 'endpoint': return { text: state.endpoint };
    case 'game': return { text: state.run?.gameName ?? 'ゲーム情報未取得' };
    case 'category': return { text: state.run?.categoryName ?? 'カテゴリ情報未取得' };
    case 'phase': return { text: state.phase ? { not_running: '待機中', running: '計測中', paused: '一時停止', ended: '完走' }[state.phase] : '—' };
    case 'method': return { text: state.context ? state.context.timingMethod === 'gameTime' ? 'Game Time' : 'Real Time' : '—' };
    case 'comparison': return { text: state.context?.comparison ?? '—' };
    case 'attempts': return { text: state.attempt?.count.toString() ?? '—' };
    case 'completed': return { text: state.completedCount?.toString() ?? '—' };
    case 'hotkey-status': return { text: '取得不可' };
    case 'real-time': return { text: displayTime(clock?.realTime) };
    case 'game-time': return { text: displayTime(clock?.gameTime) };
    case 'final-label': return { text: state.phase === 'ended' ? '完走タイム' : '比較の最終タイム' };
  }
  const run = readout(state);
  const now = clockTime(run, clock);
  switch (field) {
    case 'time':
    case 'whole':
    case 'fraction': {
      const time = displayClock(clock?.[clock.timingMethod] ?? null);
      const color = timerColor(run, now);
      return { text: field === 'time' ? time.whole + time.fraction : time[field], record: color === 'pb' ? 'pb' : '', color };
    }
    case 'current-split': return { text: splitSummary(run).current };
    case 'previous-split': return { text: splitSummary(run).previous };
    case 'split-progress': return { text: splitSummary(run).progress };
    case 'last-split': return { text: displayTime(run.lastSplit) };
    case 'split-target': return { text: displayTime(run.comparisons.rows.get(run.referenceIndex)?.get('')?.target) };
    case 'delta': return deltaValue(run.delta);
    case 'best-possible': return { text: displayTime(run.bestPossibleTime(now)) };
    case 'final-time': return { text: displayTime(run.finalTime) };
    case 'current-pace': return { text: displayTime(run.pace) };
    case 'sum-of-best': return { text: displayTime(run.sumOfBest) };
    case 'segment-time': {
      const color = timerColor(run, now);
      return { text: displayTime(segmentMetrics(run, now).segment), color, record: color === 'pb' ? 'pb' : '' };
    }
    case 'previous-segment-time': return { text: displayTime(segmentMetrics(run, null).previous), record: run.isBestSegment(run.index - 1) ? 'bs' : '' };
    case 'live-segment-delta': return deltaValue(segmentMetrics(run, now).delta);
    default: return { text: '—' };
  }
}

function deltaValue(value: number | null) {
  return { text: displayTime(value, true), sign: value === null ? '' : value < 0 ? 'ahead' : 'behind' };
}
