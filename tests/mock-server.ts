// Read-only fixture for checking the populated UI without altering a real run.
import { WebSocketServer } from 'ws';
const responses: Record<string, string> = {
  getcurrenttime: '00:12:34.5600000', getcurrenttimerphase: 'Paused',
  getgamename: 'Celeste', getcategoryname: 'Any% · テスト表示',
  gettimingmethod: 'RealTime', getcomparisonname: 'Personal Best',
  getattemptcount: '42', getcompletedcount: '12', getsplitcount: '3', getsplitindex: '1',
  getcurrentsplitname: 'Old Site', getprevioussplitname: 'Forsaken City', getdelta: '-00:00:03.4500000',
  getcomparisonsplittime: '00:14:20', getlastsplittime: '00:05:23.4500000',
  getbestpossibletime: '00:28:10', getfinaltime: '00:30:00',
  getpredictedtime: '00:29:56.55', getcurrentrealtime: '00:12:34.56', getcurrentgametime: '00:12:20.10',
  'getfinaltime Best Segments': '00:27:00',
  'getcomparisonsplittime Personal Best': '00:14:20', 'getdelta Personal Best': '-00:00:03.45',
  'getcomparisonsplittime Best Segments': '00:12:00', 'getdelta Best Segments': '00:00:20',
  'getsplitname 0': 'Forsaken City', 'getsplitname 1': 'Old Site', 'getsplitname 2': 'Celestial Resort',
};
const server = new WebSocketServer({ host: '127.0.0.1', port: 16835, path: '/livesplit' });
server.on('connection', socket => socket.on('message', data => socket.send(responses[data.toString()] ?? '-')));
console.log('Fixture: http://127.0.0.1:5173/?server=ws%3A%2F%2F127.0.0.1%3A16835%2Flivesplit');
