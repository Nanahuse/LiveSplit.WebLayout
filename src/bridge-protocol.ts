import { definitions } from './generated/protocol.ts';
import type { ChangedEvent, ResetEvent, TimerEvent, ErrorResponse } from './generated/protocol.ts';

interface Schema {
  $ref?: string; type?: string | string[]; const?: unknown; enum?: unknown[];
  anyOf?: Schema[]; oneOf?: Schema[]; properties?: Record<string, Schema>;
  required?: string[]; additionalProperties?: boolean | Schema; items?: Schema;
  minimum?: number; maximum?: number; if?: Schema; then?: Schema;
}
const defs: Record<string, Schema> = definitions;
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const invalid = (): never => { throw new Error('Invalid Bridge v4 message'); };

/** Parse integer JSON tokens before Number can round them, including in older OBS browsers. */
export function parseBridgeJson(data: unknown): unknown {
  if (typeof data !== 'string') throw new Error('Bridge v4 requires JSON text messages');
  JSON.parse(data); // Validate JSON grammar before tokenizing.
  const tokens = data.match(/"(?:[^"\\]|\\[\s\S])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g)!;
  let at = 0;
  function value(): unknown {
    const token = tokens[at++];
    if (token === '{') {
      const entries: [string, unknown][] = [];
      const keys = new Set<string>();
      while (tokens[at] !== '}') {
        const key: string = JSON.parse(tokens[at++]); at++; // colon
        if (keys.has(key)) invalid();
        keys.add(key); entries.push([key, value()]);
        if (tokens[at] !== ',') break;
        at++;
      }
      at++; return Object.fromEntries(entries);
    }
    if (token === '[') {
      const items: unknown[] = [];
      while (tokens[at] !== ']') {
        items.push(value()); if (tokens[at] !== ',') break; at++;
      }
      at++; return items;
    }
    if (/^-?\d+$/.test(token)) {
      const number = Number(token);
      return Number.isSafeInteger(number) ? number : BigInt(token);
    }
    return JSON.parse(token);
  }
  return value();
}

// Decode only the official schema vocabulary used by the read-only client.
// Property conversion follows the schema, so custom-variable names stay untouched.
function decode(schema: Schema, value: unknown): unknown {
  if (schema.$ref) return decode(defs[schema.$ref.split('/').at(-1)!], value);
  const variants = schema.anyOf ?? schema.oneOf;
  if (variants) {
    for (const variant of variants) { try { return decode(variant, value); } catch { /* Try next variant. */ } }
    return invalid();
  }
  if ('const' in schema) { if (value !== schema.const) invalid(); return value === null ? undefined : value; }
  if (schema.enum) { if (!schema.enum.includes(value)) invalid(); return value; }
  if (Array.isArray(schema.type)) return decode({ ...schema, type: schema.type.find(t => t === (value === null ? 'null' : typeof value === 'bigint' || typeof value === 'number' ? 'integer' : Array.isArray(value) ? 'array' : typeof value)) ?? 'invalid' }, value);
  switch (schema.type) {
    case 'null': if (value !== null) invalid(); return undefined;
    case 'integer': {
      if (typeof value !== 'bigint' && (typeof value !== 'number' || !Number.isSafeInteger(value))) return invalid();
      // Schema JSON numbers at the int64 bounds cannot be represented by Number.
      const wide = schema.maximum !== undefined && !Number.isSafeInteger(schema.maximum);
      const min = wide ? -(1n << 63n) : BigInt(schema.minimum!);
      const max = wide ? (1n << 63n) - 1n : BigInt(schema.maximum!);
      const integer = BigInt(value);
      if (integer < min || integer > max) invalid();
      return wide ? integer : Number(integer);
    }
    case 'string': case 'boolean': if (typeof value !== schema.type) invalid(); return value;
    case 'array': if (!Array.isArray(value)) return invalid(); return value.map(item => decode(schema.items!, item));
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
      const object = value as Record<string, unknown>;
      if (schema.required?.some(key => !Object.hasOwn(object, key))) invalid();
      if (schema.if && schema.then) {
        let matches = true;
        try { decode(schema.if, value); } catch { matches = false; }
        if (matches) decode(schema.then, value);
      }
      return Object.fromEntries(Object.entries(object).map(([key, item]) => {
        const field = schema.properties && Object.hasOwn(schema.properties, key) ? schema.properties[key] : undefined;
        if (field) return [camel(key), decode(field, item)];
        if (schema.additionalProperties === false) return invalid();
        return [key, typeof schema.additionalProperties === 'object' ? decode(schema.additionalProperties, item) : item];
      }));
    }
    case undefined: // Partial object constraints in if/then, or an unconstrained result.
      return schema.properties || schema.required ? decode({ ...schema, type: 'object' }, value) : value;
    default: return invalid();
  }
}

export const resultTypes = {
  get_timer_state: 'TimerState', get_attempt: 'AttemptState', get_run: 'RunState',
  get_context_state: 'ContextState', get_completed_count: 'CompletedCount',
} as const;
export type Query = keyof typeof resultTypes;
export interface RpcReply { requestId: number; sessionId: number; result?: unknown; error?: ErrorResponse['error'] }
export function readReply(data: unknown): RpcReply {
  const value = parseBridgeJson(data);
  // Validate the envelope first; the matching pending query determines the result type.
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const object = value as Record<string, unknown>;
  const error = Object.hasOwn(object, 'error');
  if (error === Object.hasOwn(object, 'result')) invalid();
  const envelope: Schema = { type: 'object', properties: {
    request_id: { type: 'integer', minimum: 0, maximum: 0xffffffff },
    session_id: { type: 'integer', minimum: 1, maximum: 0xffffffff },
    [error ? 'error' : 'result']: error ? { $ref: '#/$defs/BridgeError' } : {},
  }, required: ['request_id', 'session_id'], additionalProperties: false };
  return decode(envelope, object) as RpcReply;
}
export function readResult(method: Query, result: unknown): unknown { return decode(defs[resultTypes[method]], result); }
export function readEvent(data: unknown): ChangedEvent | ResetEvent | TimerEvent {
  return decode({ oneOf: ['TimerEvent', 'ResetEvent', 'ChangedEvent'].map(name => ({ $ref: `#/$defs/${name}` })) }, parseBridgeJson(data)) as ChangedEvent | ResetEvent | TimerEvent;
}
