
const WebSocket = require('ws');

//////////////////////////

const socketmap = new Map();
const wss = new WebSocket.Server({ 
  clientTracking: false, 
  noServer: true 
});
module.exports = { 
  upgrade: upgrade,
  broadcast: broadcast,
  close: close,
};

const Rooms = require('../routers/room');

//////////////////////////

function upgrade(sessionParser) {
  wss.on('connection', connect);
  return function(request, socket, head) {
    console.log('Parsing session from request...');
    sessionParser(request, {}, () => {
      if (!request.session.scope.id) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      console.log('Session is parsed!');
      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
      });
    });
  };
}

function close(scopeId) {
  if (socketmap.has(scopeId)) {
    socketmap.get(scopeId).close();
    socketmap.delete(scopeId);
  }
}

function broadcast(event, scopeIds, data) {
  for (let sid of scopeIds) {
    if (socketmap.has(sid)) {
      socketmap.get(sid).send(JSON.stringify({
        event: event,
        data: data
      }));
    }
  }
}

function connect(ws, request) {
  
  const scope = request.session.scope;
  socketmap.set(scope.id, ws);
  
  ws.on('message', onMessage);
  ws.on('close', onClose);

  ////////////////////////////////////

  function onMessage(message) {

    // Assume messages are in JSON and attempt to parse
    // This is probably use for commands
    try {
      let data = JSON.parse(message);
      data.user = scope.id;
      console.log(`Received message ${message} from user ${scope.id}`);
      // TODO: do something with this data!!!
      ws.send(JSON.stringify(data));
    }

    // Otherwise, treat it as regular text message
    // This is probably use for chatting
    catch(e) {
      let data = {
        timestamp: Date.now(),
        username: scope.username,
        roomcode: scope.roomcode,
        message: message,
      };
      console.log(data);
      let room = Rooms.getRoom(scope.roomcode);
      if (room) { broadcast('OnChatMessage', room.getUserIds(), data); }
    }
  }

  function onClose() {
    socketmap.delete(scope.id);
  }
};
