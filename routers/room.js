
const assert = require('assert');
const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const crypto = require('crypto');
const socket = require('../middlewares/socket');

///////////////////////////////

router.post('/create', create);
router.post('/join', join);
router.post('/leave', leave);

let rooms = new Map();
module.exports = router;

///////////////////////////////

/**
 * User creates a room and becomes host.
 * @param {*} req 
 * @param {*} res 
 */
function create(req, res) {
  try {

    console.log('Room create:', req.body);
    let username = req.body.username;
    assert(username);

    // Create scope for new session
    if (!req.session.scope) {
      req.session.scope = {};
      req.session.scope.id = uuid.v4();
    }

    // Generate new room code
    let roomcode = crypto.randomBytes(2).toString('hex');
    req.session.scope.username = username;
    req.session.scope.roomcode = roomcode;

    // Save users to room
    let room = { 
      roomcode: roomcode,
      host: username,
      users: [username], 
    };
    rooms.set(roomcode, room);
    console.log(req.session.scope);
    console.log(room);
    res.send(room);
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

    console.log('Room joined:', req.body);
    let username = req.body.username;
    let roomcode = req.body.roomcode;
    assert(username);
    assert(roomcode);

    // Create scope for new session
    if (!req.session.scope) {
      req.session.scope = {};
      req.session.scope.id = uuid.v4();
    }

    // Check that room exists and
    if (rooms.has(roomcode)) {
      
      req.session.scope.username = username;
      req.session.scope.roomcode = roomcode;

      // Add only new users to room
      let room = rooms.get(roomcode);
      let users = room.users;
      if (!users.includes(username)) { 
        users.push(username); 
      }
      console.log(req.session.scope);
      console.log(room);
      socket.broadcastToRoom('OnUsersJoined', roomcode, room);
      res.send(room);
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
 * Promotes another user in the room to host.
 * Only a host can do this.
 * @param {} req 
 * @param {*} res 
 */
function promote(req, res) {
  try {
    if (req.session.scope && req.session.scope.isHost) {

      let user = req.body.promote;
      let roomcode = request.session.scope.roomcode;
      let users = rooms[roomcode].users;
      if (users.includes(user)) {

      }
      
      // Check that room exists and
      // Add only new users to room
      if (rooms.has(roomcode)) {
        let users = rooms.get(roomcode).users;
        if (!users.includes(username)) { users.push(username); }
        console.log(req.session.scope);
        res.send(req.session.scope);
      }
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
 * This is an intentional action.
 * When user leaves, we get rid of their session and socket.
 * @param {} req 
 * @param {*} res
 */
function leave(req, res) {
  try {

    // user has a valid session
    // if user is host, reassign host to someone else
    if (req.session.scope) {
      let sid = request.session.scope.id;
      let roomcode = request.session.scope.roomcode;
      let users = rooms[roomcode].users;
      let isHost = request.session.scope.isHost;
      if (isHost && users.length > 1) {
        let rand = Math.floor(Math.random() * users.length);
        let user = users[rand];
        // need a way to grab the session
      }

      request.session.destroy(() => {
        socket.close(sid);
        res.send({ status: 'ok' });
      });
    }

    // user does not have a session
    else { res.send({ status: 'ok' }); }
  }
  catch (e) {
    console.log(e);
  }
}
