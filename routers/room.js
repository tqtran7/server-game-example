
const express = require('express');
const router = express.Router();
const Room = require('../models/room');

///////////////////////////////

router.post('/create', create);
router.post('/join', join);
router.post('/start', start);
router.post('/action', action);
router.post('/leave', leave);

let rooms = new Map();
module.exports = {
  router: router,
  getRoom: getRoom,
};

const socket = require('../middlewares/socket');

///////////////////////////////

function getRoom(roomcode) {
  if (rooms.has(roomcode)) {
    return rooms.get(roomcode);
  }
}

/**
 * User creates a room and becomes host.
 * @param {*} req
 * @param {*} res
 */
function create(req, res) {
  try {
    let username = req.body.username;
    let gamename = req.body.gamename;
    let room = new Room(username);
    let Game = require(`../games/${gamename}`);
    room.game = new Game(room);
    if (!req.session.scope) { req.session.scope = {}; }
    req.session.scope.id  = room.getUser(username).getId();
    req.session.scope.username  = username;
    req.session.scope.roomcode  = room.getRoomCode();
    rooms.set(room.getRoomCode(), room);
    console.log(room.toString());
    res.send(room.toString());
  }
  catch (e) {
    console.log(e);
  }
}

/**
 * User joins a room via roomcode.
 * @param {*} req
 * @param {*} res
 */
function join(req, res) {
  try {
    let username = req.body.username;
    let roomcode = req.body.roomcode;
    if (rooms.has(roomcode)) {
      let room = rooms.get(roomcode);
      room.addUser(username);
      if (!req.session.scope) { req.session.scope = {}; }
      req.session.scope.id  = room.getUser(username).getId();
      req.session.scope.username = username;
      req.session.scope.roomcode = room.getRoomCode();
      socket.broadcast(
        'OnUsersUpdate',
        room.getUserIds(),
        room.toString());
      res.send(room.toString());
    }
    else {
      res.status(400).send({ message: 'Room does not exist!' });
    }
  }
  catch (e) {
    console.log(e);
  }
}

/**
 * Start a game.
 * @param {*} req
 * @param {*} res
 */
function start(req, res) {
  try {
    let roomcode = req.body.roomcode;
    let gamename = req.body.gamename;
    if (rooms.has(roomcode)) {
      let room = rooms.get(roomcode);
      let {canStart, message} = room.game.canStart();
      if (canStart) {
        room.game.broadcast();
        res.send({ status: 'ok' });
      }
      else {
        res.status(400).send({ message });
      }
    }
    else {
      res.status(400).send({ message: 'Game does not exist!' });
    }
  }
  catch (e) {
    console.log(e);
  }
}

/**
 * Pass RPC action to the game.
 * @param {*} req
 * @param {*} res
 */
 function action(req, res) {
  try {
    // checks that room and game exists
    let roomcode = req.body.roomcode;
    if (rooms.has(roomcode)) {
      let room = rooms.get(roomcode);
      if (room.game) {
        let action = req.body.action;
        let data = req.body.actionData;
        room.game[action](req, data);
        res.send({ status: 'ok' });
      }
    }
    else {
      res.status(400).send({ message: 'Game does not exist!' });
    }
  }
  catch (e) {
    console.log(e);
  }
}

/**
 * When a user leaves the room.
 * Get rid of their session and socket.
 * If user is a host, promote another user to host.
 * @param {} req
 * @param {*} res
 */
function leave(req, res) {
  try {

    // user has a valid session
    if (req.session.scope) {

      let username = req.session.scope.username;
      let roomcode = req.session.scope.roomcode;
      if (rooms.has(roomcode)) {

        let room = rooms.get(roomcode);

        // if user is host, reassign host to next user
        let isHost = room.host.name === username;
        let usernames = room.users.keys();
        if (isHost && usernames.length > 1) {
          let nextuser = usernames[1];
          room.host = room.users.get(nextuser);
        }

        // remove user from room
        room.users.delete(username);
        socket.broadcast(
          'OnUsersUpdate',
          room.getUserIds(),
          room.toString());
      }

      req.session.destroy(() => {
        socket.close(req.session.scope.id);
      });
    }

    res.send({ status: 'ok' });
  }
  catch (e) {
    console.log(e);
  }
}
