export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function getEndpoint(search: string): string {
  const value = new URLSearchParams(search).get('server') ?? 'ws://127.0.0.1:54000/bridge/v4/rpc';
  const url = new URL(value);
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('接続先には ws:// または wss:// の WebSocket URL を指定してください。');
  }
  if (!/\/bridge\/v4\/rpc$/.test(url.pathname) || url.search) throw new Error('Bridge v4 RPC URLを指定してください');
  return url.href;
}

// Truncate instead of rounding a running clock ahead of LiveSplit.
export function clockParts(value: number | null, digits: string, accuracy: string) {
  if (value === null || !Number.isFinite(value)) return { whole: '—', fraction: '' };
  const total = Math.floor(Math.abs(value) * 100 + 1e-7);
  const seconds = Math.floor(total / 100), minutes = Math.floor(seconds / 60), hours = Math.floor(minutes / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const whole = digits === '1:23:45' || hours > 0 ? `${hours}:${pad(minutes % 60)}:${pad(seconds % 60)}`
    : digits === '1:23' || minutes > 0 ? `${minutes}:${pad(seconds % 60)}` : String(seconds);
  return { whole: `${value < 0 ? '-' : ''}${whole}`, fraction: accuracy ? `.${pad(total % 100).slice(0, accuracy.length - 1)}` : '' };
}
