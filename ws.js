
const session = require('express-session');
const express = require('express');
const path = require('path');
const http = require('http');
const uuid = require('uuid');

const WebSocket = require('ws');


const app = express();
const map = new Map();
const port = 8080;

const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

app.use(express.static('public'));
app.use(sessionParser);

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/ws.html');
  res.sendFile(filepath);
});

app.post('/login', function (req, res) {
  const id = uuid.v4();
  console.log(`Updating session for user ${id}`);
  req.session.userId = id;
  res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', function (request, response) {
  const ws = map.get(request.session.userId);
  console.log('Destroying session');
  request.session.destroy(function () {
    if (ws) ws.close();
    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

// gets called when client connects via websocket
server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');
  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    console.log('Session is parsed!');
    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', function (ws, request) {
  
  const userId = request.session.userId;
  map.set(userId, ws);

  ws.on('message', function (message) {
    let data = JSON.parse(message);
    console.log(data);
    console.log(`Received message ${message} from user ${userId}`);
    ws.send(JSON.stringify(data));
  });

  ws.on('close', function () {
    map.delete(userId);
  });
});

server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});
