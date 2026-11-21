import { active, difference } from './bridge-state.ts';
import type { Phase } from './bridge-state.ts';

export interface Comparison { target: number | null; previousDelta: number | null; previousTime: number | null; segmentTarget: number | null }
export class Comparisons {
  readonly rows = new Map<number, Map<string, Comparison>>();
  constructor(readonly index: number, readonly phase: Phase | null, private readonly bestSegments: ReadonlyMap<number, number | null>) {}

  delta(index: number, name: string, actual: number, segment = false): number | null {
    const comparison = this.rows.get(index)?.get(name);
    if (comparison?.target == null || (segment && comparison.previousDelta == null)) return null;
    return difference(actual - (segment ? comparison.previousDelta! : 0), comparison.target);
  }

  liveDelta(index: number, name: string, current: number, segment = false, showBestSegments = true): number | null {
    if (index !== this.index || !active(this.phase)) return null;
    const comparison = this.rows.get(index)?.get(name);
    if (comparison?.target == null) return null;
    const delta = difference(current, comparison.target);
    const best = this.rows.get(index)?.get('Best Segments');
    const segmentBest = this.bestSegments.get(index);
    const segmentTime = best?.previousTime == null ? null : difference(current, best.previousTime);
    const beyondBest = best?.target != null && best.previousDelta != null && difference(current, best.target) > best.previousDelta
      && segmentBest != null && segmentTime !== null && segmentTime > segmentBest;
    const visible = (!segment && delta > 0) || (showBestSegments && beyondBest) || (comparison.previousDelta != null && delta > comparison.previousDelta);
    return visible ? this.delta(index, name, current, segment) : null;
  }
}
