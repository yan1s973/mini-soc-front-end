#!/usr/bin/env node
/*
 * Serveur de test MiniSOC — sans dépendance (Node ≥ 18).
 *
 *   node tools/mock-server.js            # page sur http://localhost:8080
 *   node tools/mock-server.js --xss      # injecte des charges HTML piégées
 *
 * - HTTP  :8080  sert index.html / minisoc.css et répond à POST /simulate-attack
 * - WS    :4000  diffuse new_event / new_alert / alert_analysis (même format que le backend)
 *
 * Ne remplace pas le vrai backend : uniquement pour tester le front-end.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HTTP_PORT = Number(process.env.PORT || 8080);
const WS_PORT = 4000;
const ROOT = path.resolve(__dirname, '..');
const XSS = process.argv.includes('--xss');

const MACHINES = ['machine-01', 'machine-02', 'machine-03', 'machine-04', 'machine-05'];
const USERS = ['alice', 'bob', 'svc-backup', 'admin', null];
const TYPES = ['login_success', 'login_failed', 'file_access', 'network_connection', 'process_start'];
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- WebSocket minimal (envoi de trames texte) ---------- */
const clients = new Set();

function frame(text) {
  const payload = Buffer.from(text);
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126; header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function broadcast(obj) {
  const data = frame(JSON.stringify(obj));
  for (const sock of clients) sock.write(data);
}

const wsServer = http.createServer((req, res) => { res.writeHead(426); res.end('WebSocket only'); });
wsServer.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  clients.add(socket);
  socket.on('data', buf => { if ((buf[0] & 0x0f) === 0x8) socket.end(); }); // trame close
  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
});

/* ---------- Générateurs ---------- */
const now = () => new Date().toISOString();

function sendEvent(machine = pick(MACHINES), type = pick(TYPES), user = pick(USERS)) {
  const event = { machine, type, timestamp: now() };
  if (user) event.user = XSS && Math.random() < 0.3 ? '<img src=x onerror="window.__xss=1">' : user;
  broadcast({ type: 'new_event', event });
}

function sendAlert(pattern, severity, machine, message, analysis, delay = 1400) {
  if (XSS) message += ' <img src=x onerror="window.__xss=1"><b>gras?</b>';
  broadcast({ type: 'new_alert', alert: { pattern, severity, machine, message, timestamp: now() } });
  setTimeout(() => {
    broadcast({
      type: 'alert_analysis',
      alertPattern: pattern,
      machine,
      analysis: XSS ? analysis + ' <script>window.__xss=1<\/script><svg onload="window.__xss=1">' : analysis
    });
  }, delay);
}

// Trafic de fond
(function tick() {
  if (clients.size) sendEvent();
  setTimeout(tick, 700 + Math.random() * 900);
})();

// Alerte « high » de temps en temps
setInterval(() => {
  if (!clients.size) return;
  const m = pick(MACHINES);
  sendAlert('brute_force', 'high', m, `5 échecs d'authentification en moins de 60 s sur ${m}`,
    'Tentatives répétées depuis une même source : probable attaque par dictionnaire. Bloquer l\'IP source et forcer la rotation du mot de passe.');
}, 14000);

// Scénario déclenché par le bouton
function runScenario() {
  const steps = [];
  for (let i = 0; i < 6; i++) steps.push(() => sendEvent('machine-03', 'login_failed', 'admin'));
  steps.push(() => sendAlert('brute_force', 'high', 'machine-03', '6 échecs de connexion pour « admin » en 4 s',
    'Rafale d\'échecs sur un compte privilégié : attaque par force brute en cours. Verrouiller le compte admin et vérifier les journaux SSH.'));
  steps.push(() => sendEvent('machine-03', 'login_success', 'admin'));
  steps.push(() => sendEvent('machine-04', 'network_connection', 'admin'));
  steps.push(() => sendEvent('machine-05', 'network_connection', 'admin'));
  steps.push(() => sendAlert('lateral_movement', 'critical', 'machine-04',
    'Le compte admin compromis rebondit de machine-03 vers machine-04 et machine-05',
    'Déplacement latéral après compromission : isoler machine-03 et machine-04 du réseau, révoquer les sessions admin, lancer une analyse forensique.', 2000));
  steps.forEach((fn, i) => setTimeout(fn, i * 450));
}

/* ---------- HTTP : statiques + /simulate-attack ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/simulate-attack') {
    runScenario();
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }

  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.resolve(ROOT, '.' + (urlPath === '/' ? '/index.html' : urlPath));
  if (!file.startsWith(ROOT + path.sep) || file.includes(`${path.sep}.`)) { res.writeHead(403); res.end(); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(HTTP_PORT, () => {
  console.log(`MiniSOC mock : http://localhost:${HTTP_PORT}  (WebSocket ws://localhost:${WS_PORT})${XSS ? '  [mode XSS]' : ''}`);
});

wsServer.listen(WS_PORT);
