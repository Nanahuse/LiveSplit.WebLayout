import { WebSocketServer } from 'ws';
import { fixture, respond } from './bridge-fixture.ts';
const snapshot = fixture();
const server = new WebSocketServer({ host: '127.0.0.1', port: 54001 });
server.on('connection', (socket, request) => {
  if (request.url === '/bridge/v3/rpc') socket.on('message', data => socket.send(respond(new Uint8Array(data as Buffer), snapshot)));
  else if (request.url !== '/bridge/v3/events') socket.close();
});
console.log('Mock Bridge v3: ws://127.0.0.1:54001/bridge/v3/rpc');
