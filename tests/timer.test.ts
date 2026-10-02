import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, getEndpoint, TimerConnection } from '../src/timer.ts';
import type { TimerSocket, TimerDisplay, ConnectionStatus } from '../src/timer.ts';
import type { ReadCommand } from '../src/timer.ts';

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
  assert.equal(getEndpoint(''), 'ws://localhost:16834/livesplit');
  assert.equal(getEndpoint('?server=wss%3A%2F%2Fexample.com%2Flivesplit'), 'wss://example.com/livesplit');
  for (const server of ['https://example.com', 'no-url', 'ws://user:pass@localhost/', 'ws://localhost/#fragment']) {
    assert.throws(() => getEndpoint(`?server=${encodeURIComponent(server)}`));
  }
});

class FakeSocket implements TimerSocket {
  onopen: TimerSocket['onopen'] = null;
  onmessage: TimerSocket['onmessage'] = null;
  onerror: TimerSocket['onerror'] = null;
  onclose: TimerSocket['onclose'] = null;
  sent: string[] = [];
  closed = false;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) { this.sent.push(String(data)); }
  close() { this.closed = true; }
  open() { this.onopen?.call(this as unknown as WebSocket, new Event('open')); }
  message(data: string) { this.onmessage?.call(this as unknown as WebSocket, new MessageEvent('message', { data })); }
}

function setup() {
  const sockets: FakeSocket[] = [];
  const times: TimerDisplay[] = [];
  const statuses: ConnectionStatus[] = [];
  const connection = new TimerConnection('ws://localhost:16834/livesplit', {
    createSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; },
    onTime: time => times.push(time), onStatus: status => statuses.push(status),
  });
  connection.start();
  return { connection, sockets, times, statuses };
}

test('polls read-only with one outstanding request and reflects pause/reset', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { connection, sockets, times, statuses } = setup();
  t.after(() => connection.stop());
  const socket = sockets[0];
  socket.open();
  assert.deepEqual(socket.sent, ['getcurrenttime']);
  t.mock.timers.tick(100);
  assert.equal(socket.sent.length, 1);
  for (const input of ['00:01:23.4500000', '00:01:23.4500000', '00:00:00']) {
    socket.message(input);
    t.mock.timers.tick(33);
  }
  assert.deepEqual(times, [
    { whole: '1:23', fraction: '.45' }, { whole: '1:23', fraction: '.45' }, { whole: '0:00', fraction: '.00' },
  ]);
  assert.equal(statuses.at(-1), 'connected');
  assert.ok(socket.sent.every(command => command === 'getcurrenttime'));
  connection.stop();
  t.mock.timers.tick(10000);
  assert.equal(sockets.length, 1);
  assert.equal(socket.closed, true);
});

test('times out stalled responses and reconnects without accepting old data', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { connection, sockets, times, statuses } = setup();
  t.after(() => connection.stop());
  sockets[0].open();
  t.mock.timers.tick(3000);
  assert.equal(sockets[0].closed, true);
  assert.equal(statuses.at(-1), 'disconnected');
  t.mock.timers.tick(2000);
  assert.equal(sockets.length, 2);
  sockets[0].message('00:00:10');
  assert.equal(times.length, 0);
  sockets[1].open();
  sockets[1].message('00:00:11');
  assert.equal(times[0].whole, '0:11');
});

test('connection timeout and invalid replies both trigger recovery', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { connection, sockets, statuses } = setup();
  t.after(() => connection.stop());
  t.mock.timers.tick(3000);
  assert.equal(statuses.at(-1), 'disconnected');
  t.mock.timers.tick(2000);
  sockets[1].open();
  sockets[1].message('-');
  assert.equal(sockets[1].closed, true);
  assert.equal(statuses.at(-1), 'disconnected');
  connection.stop();
  t.mock.timers.tick(10000);
  assert.equal(sockets.length, 2);
});

test('readout timeouts invalidate the socket before the next command', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeSocket[] = [];
  const replies: Array<[ReadCommand, string | null]> = [];
  const commands: ReadCommand[] = ['getgamename', 'getcurrenttimerphase'];
  const client = new TimerConnection('ws://localhost:16834/livesplit', {
    onTime() { assert.fail('Readout must not update the timer'); }, onStatus() {},
    createSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; },
    readout: { nextCommand: () => commands.shift()!, onResponse: (command, value) => replies.push([command, value]) },
  });
  t.after(() => client.stop());
  client.start(); sockets[0].open();
  t.mock.timers.tick(3000);
  assert.deepEqual(replies, [['getgamename', null]]);
  t.mock.timers.tick(2000);
  sockets[1].open();
  sockets[0].message('Late name');
  sockets[1].message('Paused');
  assert.deepEqual(replies, [['getgamename', null], ['getcurrenttimerphase', 'Paused']]);
  assert.equal(sockets[0].closed, true);
});
