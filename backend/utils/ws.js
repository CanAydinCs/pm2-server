const { WebSocketServer } = require('ws');

let wss;

function initWS(server) {
  wss = new WebSocketServer({ server, path: '/pm2/master/ws' });
  wss.on('connection', (ws) => {
    ws.on('error', console.error);
  });
}

function broadcast(type, data) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

function getWSS() {
  return wss;
}

module.exports = { initWS, broadcast, getWSS };
