import { bridgeClock, bridgeState } from '../src/bridge-state.ts';
import type { BridgeSnapshot } from '../src/bridge-client.ts';
import { readout } from '../src/readout.ts';

export function readSnapshot(snapshot: BridgeSnapshot, now = snapshot.timerAt) {
  const state = bridgeState('ws://127.0.0.1:54000/bridge/v4/rpc', snapshot);
  return { state, model: readout(state), clock: bridgeClock(state, snapshot, now) };
}
