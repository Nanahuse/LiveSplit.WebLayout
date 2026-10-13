export function comparisonNames(value: string | null): string[] {
  if (!value?.trim()) return ['']; // LiveSplit's selected comparison
  return [...new Set(value.split('|').map(name => name.trim()).filter(name => name && !/[\r\n\0]/.test(name)))];
}

interface Comparison { target: number | null; previousDelta: number | null; previousTime?: number | null; segmentTarget?: number | null }
export class Comparisons {
  readonly rows = new Map<number, Map<string, Comparison>>();
  readonly bestSegments = new Map<number, number | null>();
  index = -1;
  phase = '';
  sumOfBest: number | null = null;
  // null means the server explicitly reported no comparison; undefined means unknown.
  finalComparisonDelta: number | null | undefined;
  delta(index: number, name: string, actual: number, segment = false): number | null {
    const comparison = this.rows.get(index)?.get(name);
    if (comparison?.target == null || (segment && comparison.previousDelta == null)) return null;
    return actual - comparison.target - (segment ? comparison.previousDelta! : 0);
  }
  liveDelta(index: number, name: string, current: number, segment = false): number | null {
    if (index !== this.index || !['Running', 'Paused'].includes(this.phase)) return null;
    const comparison = this.rows.get(index)?.get(name);
    if (comparison?.target == null) return null;
    const delta = current - comparison.target;
    const best = this.rows.get(index)?.get('Best Segments');
    // Bridge supplies the individual best as well as the cumulative comparison.
    const segmentBest = this.bestSegments.get(index);
    const segmentTime = best?.previousTime == null ? null : current - best.previousTime;
    const beyondBest = best?.target != null && best.previousDelta != null && current - best.target > best.previousDelta
      && segmentBest != null && segmentTime !== null && segmentTime > segmentBest;
    const visible = (!segment && delta > 0) || beyondBest || (comparison.previousDelta != null && delta > comparison.previousDelta);
    return visible ? this.delta(index, name, current, segment) : null;
  }
  clear() { this.rows.clear(); this.bestSegments.clear(); this.sumOfBest = null; this.finalComparisonDelta = undefined; this.index = -1; this.phase = ''; }
}
