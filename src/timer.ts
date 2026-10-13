// LiveSplit uses the constant TimeSpan format: [-][d.]hh:mm:ss[.fffffff].
export interface TimerDisplay { whole: string; fraction: string }
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type ReadField = `getcustomvariablevalue ${string}` | 'globalhotkeysenabled' | 'getpredictedtime' | 'getcurrentrealtime' | 'getcurrentgametime' | 'getfinaltime Best Segments' | 'getgamename' | 'getcategoryname' | 'getcurrenttimerphase' | 'gettimingmethod' | 'getcomparisonname' | 'getattemptcount' | 'getcompletedcount' | 'getsplitcount' | 'getsplitindex' | 'getcurrentsplitname' | 'getprevioussplitname' | 'getcomparisonsplittime' | 'getlastsplittime' | 'getdelta' | 'getbestpossibletime' | 'getfinaltime' | `getsplitname ${number}` | `getcomparisonsplittime ${string}` | `getdelta ${string}`;
export function formatTime(value: string): TimerDisplay | null {
  const match = /^(-)?(?:(\d+)\.)?(\d+):(\d{2}):(\d{2})(?:\.(\d{1,7}))?$/.exec(value.trim());
  if (!match || Number(match[4]) > 59 || Number(match[5]) > 59) return null;
  const [, sign = '', days = '0', hours, minutes, seconds, fraction = ''] = match;
  const totalHours = Number(days) * 24 + Number(hours);
  if (!Number.isSafeInteger(totalHours)) return null;
  return {
    whole: `${sign}${totalHours ? `${totalHours}:${minutes}` : Number(minutes)}:${seconds}`,
    fraction: `.${fraction.padEnd(2, '0').slice(0, 2)}`,
  };
}

export function getEndpoint(search: string): string {
  const value = new URLSearchParams(search).get('server') ?? 'ws://127.0.0.1:54000/bridge/v3/rpc';
  const url = new URL(value);
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('接続先には ws:// または wss:// の WebSocket URL を指定してください。');
  }
  if (!/\/bridge\/v3\/rpc$/.test(url.pathname) || url.search) throw new Error('Bridge v3 RPC URLを指定してください');
  return url.href;
}
