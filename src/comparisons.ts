import type { ReadCommand } from './timer.ts';
import { seconds } from './splits.ts';

export function comparisonNames(value: string | null): string[] {
  if (!value?.trim()) return ['']; // LiveSplit's selected comparison
  return [...new Set(value.split('|').map(name => name.trim()).filter(name => name && !/[\r\n\0]/.test(name)))];
}

interface Comparison { target: number | null; previousDelta: number | null }
export class Comparisons {
  names = new Set<string>(['']);
  readonly rows = new Map<number, Map<string, Comparison>>();
  index = -1;
  phase = '';
  private method = '';
  private selected = '';
  private commands: ReadCommand[] = [];
  private values: string[] = [];
  private sampledNames: string[] = [];
  begin() {
    this.sampledNames = [...new Set([...this.names, 'Best Segments'])];
    this.commands = ['getcurrenttimerphase', 'getsplitindex', 'gettimingmethod', 'getcomparisonname',
      ...this.sampledNames.flatMap<ReadCommand>(name => [name ? `getcomparisonsplittime ${name}` : 'getcomparisonsplittime', name ? `getdelta ${name}` : 'getdelta']),
      'getcomparisonname', 'gettimingmethod', 'getsplitindex', 'getcurrenttimerphase'];
    this.values = [];
  }
  next(): ReadCommand | undefined { return this.commands[this.values.length]; }
  receive(value: string | null) {
    if (value === null) this.phase = ''; // Do not keep a live delta after a failed read.
    this.values.push(value?.trim() ?? '');
    if (this.next()) return;
    const v = this.values;
    this.commands = [];
    const [phase, indexText, method, selected] = v;
    if (!phase || phase !== v.at(-1) || indexText !== v.at(-2) || method !== v.at(-3) || selected !== v.at(-4)) return;
    const index = Number(indexText);
    if (!/^-?\d+$/.test(indexText) || index < -1 || index > 1000) return;
    if (method !== this.method || selected !== this.selected || phase === 'NotRunning') this.rows.clear();
    if (index < this.index || (this.phase === 'Ended' && phase !== 'Ended')) {
      for (const key of this.rows.keys()) if (key >= index) this.rows.delete(key);
    }
    this.index = index; this.phase = phase; this.method = method; this.selected = selected;
    if (!['Running', 'Paused'].includes(phase) || index < 0) return;
    this.rows.set(index, new Map(this.sampledNames.map((name, i) => [name, {
      target: seconds(v[4 + i * 2]), previousDelta: index === 0 ? 0 : seconds(v[5 + i * 2]),
    }])));
  }
  liveDelta(index: number, name: string, current: number): number | null {
    if (index !== this.index || !['Running', 'Paused'].includes(this.phase)) return null;
    const comparison = this.rows.get(index)?.get(name);
    if (comparison?.target == null) return null;
    const delta = current - comparison.target;
    const best = this.rows.get(index)?.get('Best Segments');
    // Best Segments supplies the reachable cumulative pace. Unlike the native
    // helper, the server cannot expose the individual BestSegmentTime guard.
    const beyondBest = best?.target != null && best.previousDelta != null && current - best.target > best.previousDelta;
    return delta > 0 || beyondBest || (comparison.previousDelta != null && delta > comparison.previousDelta) ? delta : null;
  }
  clear() { this.rows.clear(); this.index = -1; this.phase = ''; this.commands = []; this.values = []; }
}
