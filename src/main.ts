import { getEndpoint, TimerConnection } from './timer.ts';
import type { ConnectionStatus } from './timer.ts';
import { RunReadout, renderReadout } from './readout.ts';

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
  const run = new RunReadout();
  let details: TimerConnection;
  let previousState: ConnectionStatus | undefined;
  const connection = new TimerConnection(endpoint, {
    onTime(time) {
      whole.textContent = time.whole; fraction.textContent = time.fraction;
      run.liveTime = `${time.whole}${time.fraction}`;
      const live = document.querySelector<HTMLElement>('[data-live]');
      if (live) live.textContent = run.liveTime;
    },
    onStatus(state) {
      document.body.dataset.state = state;
      [status.textContent, hint.textContent] = messages[state];
      if (state !== 'connected') {
        whole.textContent = '—:—'; fraction.textContent = '.—';
        details?.stop(); run.clear(); renderReadout(run);
      } else if (previousState !== state && params.get('overlay') !== '1') { details.start(); }
      previousState = state;
    },
  });
  details = new TimerConnection(endpoint, {
    onTime() {}, onStatus() {}, interval: 33, timeout: 1000, retry: 250,
    readout: {
      nextCommand: () => run.nextCommand(),
      onResponse(command, value) { run.receive(command, value); renderReadout(run); },
    },
  });
  connection.start();
  window.addEventListener('pagehide', () => { connection.stop(); details.stop(); });
  window.addEventListener('pageshow', () => connection.start());
} catch {
  document.body.dataset.state = 'error';
  status.textContent = '接続先エラー';
  hint.textContent = 'URL の server パラメーターに正しい ws:// または wss:// の接続先を指定してください。';
}
