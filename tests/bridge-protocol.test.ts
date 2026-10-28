import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBridgeJson, readReply, readResult, readEvent } from '../src/bridge-protocol.ts';
import { fixture, stringify, wire } from './bridge-fixture.ts';

test('JSON v4 preserves signed int64 ticks and arbitrary custom-variable keys', () => {
  const state = fixture();
  state.timer.realTimeTicks = 9223372036854775807n;
  state.timer.gameTimeTicks = -9223372036854775808n;
  const raw = parseBridgeJson(stringify(wire('TimerState', state.timer)));
  assert.deepEqual(readResult('get_timer_state', raw), state.timer);
  const variables = JSON.parse('{"snake_case":"kept","__proto__":"literal","constructor":"also literal"}');
  state.context.customVariables = variables;
  assert.deepEqual(readResult('get_context_state', wire('ContextState', state.context)), state.context);
  assert.deepEqual(parseBridgeJson('{"text":"escaped \\\" 9223372036854775807","items":[null,true,-9223372036854775808]}'), { text: 'escaped " 9223372036854775807', items: [null, true, -9223372036854775808n] });
});

test('JSON v4 validates result shapes, ranges, nulls and message envelopes', () => {
  const timer = wire('TimerState', fixture().timer) as Record<string, unknown>;
  const decoded = readResult('get_timer_state', { ...timer, game_time_ticks: null }) as { gameTimeTicks?: bigint };
  assert.equal(decoded.gameTimeTicks, undefined);
  for (const bad of [null, [], { ...timer, phase: 2 }, { ...timer, real_time_ticks: '42' }, { ...timer, real_time_ticks: 9223372036854775808n }, { ...timer, game_time_ticks: -9223372036854775809n }, { ...timer, split_index: 0x80000000 }, { ...timer, surprise: 0 }]) {
    assert.throws(() => readResult('get_timer_state', bad));
  }
  const missing = { ...timer }; delete missing.is_game_time_paused;
  assert.throws(() => readResult('get_timer_state', missing));
  assert.deepEqual(readReply('{"request_id":0,"session_id":1,"error":{"code":"internal_error","message":"query failed"}}'), { requestId: 0, sessionId: 1, error: { code: 'internal_error', message: 'query failed' } });
  for (const bad of [new Uint8Array(), '[]', 'null', '{}', '{"request_id":0,"session_id":0,"result":{}}', '{"request_id":4294967296,"session_id":1,"result":{}}', '{"request_id":0,"request_id":1,"session_id":1,"result":{}}', '{"request_id":0,"session_id":1,"result":null,"error":{}}']) assert.throws(() => readReply(bad));
  for (const type of ['timer_reset', 'run_changed', 'context_changed']) assert.equal(readEvent(stringify({ session_id: 1, event_sequence: 0xffffffff, type, timer_state: null })).timerState, undefined);
  for (const event of [{ session_id: 1, event_sequence: 0, type: 'run_changed', timer_state: null }, { session_id: 1, event_sequence: 1, type: 'timer_split', timer_state: null }, { session_id: 1, event_sequence: 1, type: 'run_changed' }]) assert.throws(() => readEvent(stringify(event)));
});
