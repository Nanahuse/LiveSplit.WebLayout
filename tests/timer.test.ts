import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, getEndpoint } from '../src/timer.ts';

test('formats LiveSplit TimeSpan values without rounding ahead', () => {
  for (const [input, whole, fraction] of [
    ['00:00:00', '0:00', '.00'],
    ['00:01:23.4567890', '1:23', '.45'],
    ['01:02:03.9', '1:02:03', '.90'],
    ['-00:00:05.1200000', '-0:05', '.12'],
    ['2.03:04:05.0090000', '51:04:05', '.00'],
    ['100:00:00', '100:00:00', '.00'],
  ]) assert.deepEqual(formatTime(input), { whole, fraction });
  for (const input of ['-', '', 'Running', '00:60:00', '{"data":0}', '00:00:00.12345678']) {
    assert.equal(formatTime(input), null);
  }
});

test('accepts only valid WebSocket endpoints', () => {
  assert.equal(getEndpoint(''), 'ws://127.0.0.1:54000/bridge/v3/rpc');
  assert.equal(getEndpoint('?server=wss%3A%2F%2Fexample.com%2Fbridge%2Fv3%2Frpc'), 'wss://example.com/bridge/v3/rpc');
  for (const server of ['https://example.com', 'no-url', 'ws://user:pass@localhost/', 'ws://localhost/#fragment']) {
    assert.throws(() => getEndpoint(`?server=${encodeURIComponent(server)}`));
  }
});
