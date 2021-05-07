
const crypto = require('crypto');
const express = require('express');
const parser = require('body-parser')
const path = require('path');
const app = express();
const port = 3000;

const persons = require('./data/person');
const descriptor = require('./data/descriptor');
const gadget = require('./data/gadget');

app.use(express.static('public'));
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/home.html');
  res.sendFile(filepath);
});

app.get('/game', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/game.html');
  res.sendFile(filepath);
});

const server = require('http').createServer(app);
const snakeoil = require('socket.io')(server);

let rooms = {};
let sessions = {};

snakeoil.on('connection', async(socket) => {

  // user creates a room
  socket.on('OnRoomCreate', (username, callback) => {
    try {
      let roomcode = crypto.randomBytes(2).toString('hex');
      let sessionId = crypto.randomBytes(6).toString('hex');
      rooms[roomcode] = { users: [username] };
      sessions[sessionId] = {
        name: username,
        room: roomcode,
        isCreator: true,
      };
      socket.join(roomcode);
      console.log(`User:${username} socket:${socket.id}`);
      callback({ sessionId: sessionId });
    }
    catch(e) {
      console.log(e);
    }
  });

  // User joins a room
  socket.on("OnRoomJoinRequest", (username, roomcode, callback) => {
    try {
      let room = rooms[roomcode];
      let sessionId = crypto.randomBytes(6).toString('hex');
      room.users.push(username);
      sessions[sessionId] = {
        name: username,
        room: roomcode,
        isCreator: false,
      };
      socket.join(roomcode);
      console.log(`User:${username} socket:${socket.id}`);
      callback({ sessionId: sessionId });
    }
    catch(e) {
      console.log(e);
    }
  });

  // User enters a room
  socket.on("OnRoomEnter", (sessionId, callback) => {
    try {
      let session = sessions[sessionId];
      let username = session.name;
      let roomcode = session.room;
      let room = rooms[roomcode];
      console.log(`User:${username} socket:${socket.id}`);
      socket.join(roomcode);
      snakeoil.to(roomcode).emit('OnUsersEnterOrExit', room.users);
      callback(session);
    }
    catch(e) {
      console.log(e);
    }
  });

  // User exits a room
  socket.on("OnRoomExit", (username, callback) => {
    try {
      let roomcode = session.user.room;
      let room = rooms[roomcode];
      let index = room.users.indexOf(username);
      room.users.splice(index, 1);
      socket.emit('OnUsersEnterOrExit', room.users);
      callback({ status: 'ok' });
    }
    catch(e) {
      console.log(e);
    }
  });


});

server.listen(3000, ()=> {
  console.log('Snake Oil Server Started!');
});
