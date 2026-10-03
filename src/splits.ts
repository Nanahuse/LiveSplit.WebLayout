import { formatTime } from './timer.ts';
import type { ReadCommand } from './timer.ts';

// Bracket each sample with index AND phase reads. Never attach a time to a
// different segment if LiveSplit advances while the requests are in flight.
export const splitCommands: ReadCommand[] = ['getcurrenttimerphase', 'getsplitindex',
  'getcurrentsplitname', 'getprevioussplitname', 'getcomparisonsplittime', 'getlastsplittime',
  'getsplitindex', 'getcurrenttimerphase'];
export interface SplitRow { index: number; name?: string; time?: string; target?: string }

export class SplitHistory {
  readonly rows = new Map<number, SplitRow>();
  index = -1;
  phase = '';
  private position = 0;
  private sample: string[] = [];

  receive(command: ReadCommand, value: string | null) {
    if (command !== splitCommands[this.position]) return;
    this.sample.push(value ?? '');
    if (++this.position < splitCommands.length) return;
    const [phase, start, current, previous, target, time, end, endPhase] = this.sample;
    this.position = 0; this.sample = [];
    if (!phase || phase !== endPhase || start !== end || !/^-?\d+$/.test(start)) return;
    const index = Number(start);
    if (!Number.isSafeInteger(index) || index < -1 || index > 1000) return;
    if (phase === 'NotRunning') { this.rows.clear(); this.index = -1; this.phase = phase; return; }
    if (!['Running', 'Paused', 'Ended'].includes(phase) || index < 0) return;
    // An undo invalidates this segment's old result and all later results.
    if (index < this.index || (this.phase === 'Ended' && phase !== 'Ended')) {
      for (const key of this.rows.keys()) if (key >= index) this.rows.delete(key);
    }
    this.index = index; this.phase = phase;
    const validName = (name: string) => name && name !== '-' ? name : undefined;
    const validTime = (value: string) => formatTime(value) ? value : undefined;
    if (index > 0) {
      const old = this.rows.get(index - 1);
      this.rows.set(index - 1, { ...old, index: index - 1, name: validName(previous) ?? old?.name, time: validTime(time) });
    }
    if (phase !== 'Ended') this.rows.set(index, { index, name: validName(current), target: validTime(target) });
  }

  clear() { this.rows.clear(); this.index = -1; this.phase = ''; this.position = 0; this.sample = []; }
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
