import { getEndpoint, TimerConnection } from './timer.ts';
import type { ConnectionStatus } from './timer.ts';

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle('overlay', params.get('overlay') === '1');
const whole = document.querySelector<HTMLElement>('#whole')!;
const fraction = document.querySelector<HTMLElement>('#fraction')!;
const status = document.querySelector<HTMLElement>('#status')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const messages: Record<ConnectionStatus, [string, string]> = {
  connecting: ['接続中', 'LiveSplit の WebSocket サーバーに接続しています。'],
  connected: ['接続済み', 'タイマーの操作は LiveSplit 側で行ってください。'],
  disconnected: ['再接続待ち', 'LiveSplit の Control → Start WS Server を確認してください。自動で再接続します。'],
};

try {
  const endpoint = getEndpoint(location.search);
  document.querySelector<HTMLElement>('#endpoint')!.textContent = endpoint;
  const connection = new TimerConnection(endpoint, {
    onTime(time) { whole.textContent = time.whole; fraction.textContent = time.fraction; },
    onStatus(state) {
      document.body.dataset.state = state;
      [status.textContent, hint.textContent] = messages[state];
      if (state !== 'connected') { whole.textContent = '—:—'; fraction.textContent = '.—'; }
    },
  });
  connection.start();
  window.addEventListener('pagehide', () => connection.stop());
  window.addEventListener('pageshow', () => connection.start());
} catch {
  document.body.dataset.state = 'error';
  status.textContent = '接続先エラー';
  hint.textContent = 'URL の server パラメーターに正しい ws:// または wss:// の接続先を指定してください。';
}
