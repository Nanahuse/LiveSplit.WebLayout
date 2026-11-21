import { displayClock } from '../src/readout.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEndpoint } from '../src/timer.ts';

test('formats numeric seconds without rounding ahead', () => {
  for (const [input, whole, fraction] of [
    [0, '0:00', '.00'],
    [83.456789, '1:23', '.45'],
    [3723.9, '1:02:03', '.90'],
    [-5.12, '-0:05', '.12'],
    [183845.009, '51:04:05', '.00'],
    [360000, '100:00:00', '.00'],
    [null, '—', ''],
  ] as const) assert.deepEqual(displayClock(input), { whole, fraction });
});

test('accepts only valid WebSocket endpoints', () => {
  assert.equal(getEndpoint(''), 'ws://127.0.0.1:54000/bridge/v4/rpc');
  assert.equal(getEndpoint('?server=wss%3A%2F%2Fexample.com%2Fbridge%2Fv4%2Frpc'), 'wss://example.com/bridge/v4/rpc');
  for (const server of ['https://example.com', 'no-url', 'ws://user:pass@localhost/', 'ws://localhost/#fragment', 'ws://localhost/bridge/v3/rpc', 'ws://localhost/bridge/v4/rpc?x=1']) {
    assert.throws(() => getEndpoint(`?server=${encodeURIComponent(server)}`));
  }
});
