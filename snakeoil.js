
const crypto = require('crypto');
const session = require('express-session');
const express = require('express');
const parser = require('body-parser');
const path = require('path');
const http = require('http');
const uuid = require('uuid');

const WebSocket = require('ws');
const app = express();
const map = new Map();

const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

app.use(express.static('public'));
app.use(sessionParser);
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

let rooms = {};

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/snakeoil.html');
  res.sendFile(filepath);
});

app.post('/login', function (req, res) {
  
  console.log(req.body);
  let username = req.body.username;
  let roomcode = req.body.roomcode;
  if (roomcode) {

    // This room exists! Add user to this room
    if (rooms[roomcode]) {
      rooms[roomcode].users.push(username);
      req.session.user = {
        name: username,
        room: roomcode,
        isCreator: false,
      };
      res.send(roomcode);
    }
    else {
      res.status(400).send('Invalid roomcode!');
    }
  }

  // roomcode is NOT provided by the user
  // so we need to create a room code
  else {
    let roomcode = crypto.randomBytes(2).toString('hex');
    rooms[roomcode] = { users: [username] };
    req.session.user = {
      name: username,
      room: roomcode,
      isCreator: true,
    };
    res.send(roomcode);
  }
});

app.delete('/logout', function (request, response) {
  const ws = map.get(request.session.username);
  console.log('Destroying session');
  request.session.destroy(function () {
    if (ws) ws.close();
    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session.username) {
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
  
  const username = request.session.username;
  map.set(username, ws);

  ws.on('message', function (message) {
    console.log(`Received message ${message} from user ${username}`);
  });

  // User enters a room
  ws.on("OnRoomEnter", (callback) => {
    try {
      let username = request.session.user.name;
      let roomcode = request.session.user.room;
      let room = rooms[roomcode];
      let str = `User:${username} entered room ${roomcode}`;
      console.log(str);
      // wss.emit('OnUsersEnterOrExit', room.users);
      ws.send(str);
    }
    catch(e) {
      console.log(e);
    }
  });

  ws.on('close', function () {
    map.delete(username);
  });
});

const port = 3000;
server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});