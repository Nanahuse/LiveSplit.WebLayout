// LiveSplit uses the constant TimeSpan format: [-][d.]hh:mm:ss[.fffffff].
export interface TimerDisplay { whole: string; fraction: string }
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type TimerSocket = Pick<WebSocket, 'onopen' | 'onmessage' | 'onerror' | 'onclose' | 'send' | 'close'>;
interface ConnectionOptions {
  onTime: (time: TimerDisplay) => void;
  onStatus: (status: ConnectionStatus) => void;
  createSocket?: (address: string) => TimerSocket;
  interval?: number;
  timeout?: number;
  retry?: number;
}

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
  const value = new URLSearchParams(search).get('server') ?? 'ws://localhost:16834/livesplit';
  const url = new URL(value);
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('接続先には ws:// または wss:// の WebSocket URL を指定してください。');
  }
  return url.href;
}

// Only one request is in flight: responses contain no request ID or command name.
export class TimerConnection {
  private stopped = true;
  private pending = false;
  private socket: TimerSocket | null = null;
  private deadline?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private readonly onTime: ConnectionOptions['onTime'];
  private readonly onStatus: ConnectionOptions['onStatus'];
  private readonly createSocket: NonNullable<ConnectionOptions['createSocket']>;
  private readonly interval: number;
  private readonly timeout: number;
  private readonly retry: number;

  constructor(private readonly url: string, { onTime, onStatus, createSocket = (address) => new WebSocket(address), interval = 33, timeout = 3000, retry = 2000 }: ConnectionOptions) {
    this.onTime = onTime;
    this.onStatus = onStatus;
    this.createSocket = createSocket;
    this.interval = interval;
    this.timeout = timeout;
    this.retry = retry;
  }

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.connect();
  }

  private connect() {
    if (this.stopped) return;
    this.onStatus('connecting');
    let socket: TimerSocket;
    try { socket = this.createSocket(this.url); }
    catch { this.reconnect(); return; }
    this.socket = socket;
    this.deadline = setTimeout(() => this.fail(socket), this.timeout);
    socket.onopen = () => {
      if (this.socket !== socket) return;
      clearTimeout(this.deadline);
      this.request(socket);
    };
    socket.onmessage = ({ data }) => {
      if (this.socket !== socket || !this.pending) return;
      this.pending = false;
      clearTimeout(this.deadline);
      const time = typeof data === 'string' ? formatTime(data) : null;
      if (!time) { this.fail(socket); return; }
      this.onStatus('connected');
      this.onTime(time);
      this.poll = setTimeout(() => this.request(socket), this.interval);
    };
    socket.onerror = socket.onclose = () => this.fail(socket);
  }

  private request(socket: TimerSocket) {
    if (this.stopped || this.socket !== socket) return;
    this.pending = true;
    this.deadline = setTimeout(() => this.fail(socket), this.timeout);
    try { socket.send('getcurrenttime'); }
    catch { this.fail(socket); }
  }

  private fail(socket: TimerSocket) {
    if (this.socket !== socket) return;
    this.release();
    this.reconnect();
  }

  private reconnect() {
    if (this.stopped) return;
    this.onStatus('disconnected');
    this.retryTimer = setTimeout(() => this.connect(), this.retry);
  }

  private release() {
    clearTimeout(this.deadline);
    clearTimeout(this.poll);
    clearTimeout(this.retryTimer);
    this.pending = false;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      socket.close();
    }
  }

  stop() {
    this.stopped = true;
    this.release();
  }
}
