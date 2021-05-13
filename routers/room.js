
const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const crypto = require('crypto');

///////////////////////////////

router.post('/create', create);
router.post('/join', join);

let rooms = new Map();
module.exports = router;

///////////////////////////////

 function create(req, res) {
  try {

    console.log(req.body);

    // Create scope for new session
    if (!req.session.scope) {
      req.session.scope = {};
      req.session.scope.id = uuid.v4();
    }

    // Generate new room code
    let roomcode = crypto.randomBytes(2).toString('hex');
    req.session.scope.username = req.body.username;
    req.session.scope.roomcode = roomcode;
    req.session.scope.isHost = true;

    // Save users to room
    let users = [req.body.username];
    rooms.set(roomcode, { users });
    console.log(req.session.scope);
    res.send(req.session.scope);
  }
  catch (e) {
    console.log(e);
  }
}

function join(req, res) {
  try {

    // Create scope for new session
    if (!req.session.scope) {
      req.session.scope = {};
      req.session.scope.id = uuid.v4();
    }

    let username = req.body.username;
    let roomcode = req.body.roomcode;
    req.session.scope.username = username;
    req.session.scope.roomcode = roomcode;
    req.session.scope.isHost = false;
    
    // Check that room exists and
    // Add only new users to room
    if (rooms.has(roomcode)) {
      let users = rooms.get(roomcode).users;
      if (!users.includes(username)) { users.push(username); }
      console.log(req.session.scope);
      res.send(req.session.scope);
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
    if (req.session.scope) {
      let ws = map.get(request.session.scope.id);
      request.session.destroy(() => {
        if (ws) { ws.close(); }
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
