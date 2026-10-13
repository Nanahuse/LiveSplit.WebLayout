import { formatTime } from './timer.ts';
export interface SplitRow { index: number; name?: string; time?: string; target?: string }

export class SplitHistory {
  readonly rows = new Map<number, SplitRow>();
  index = -1;
  phase = '';
  clear() { this.rows.clear(); this.index = -1; this.phase = ''; }
}

export function seconds(value: string): number | null {
  if (!formatTime(value)) return null;
  const match = /^(-)?(?:(\d+)\.)?(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(value.trim())!;
  return (match[1] ? -1 : 1) * (Number(match[2] ?? 0) * 86400 + Number(match[3]) * 3600 + Number(match[4]) * 60 + Number(match[5]) + Number(`0.${match[6] ?? 0}`));
}

export function splitDelta(row: SplitRow): string | undefined {
  if (!row.time || !row.target) return undefined;
  const actual = seconds(row.time), target = seconds(row.target);
  if (actual === null || target === null) return undefined;
  return formatDelta(actual - target);
}

export function formatDelta(difference: number): string {
  const centiseconds = Math.round(Math.abs(difference) * 100);
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor(centiseconds / 6000) % 60;
  const secs = Math.floor(centiseconds / 100) % 60;
  return `${difference < 0 ? '-' : '+'}${hours ? `${hours}:${String(minutes).padStart(2, '0')}` : minutes}:${String(secs).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`;
}
