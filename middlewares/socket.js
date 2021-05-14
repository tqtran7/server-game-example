
const WebSocket = require('ws');

//////////////////////////

const socketmap = new Map();
const wss = new WebSocket.Server({ 
  clientTracking: false, 
  noServer: true 
});
module.exports = { 
  upgrade: upgrade,
  broadcastToRoom: broadcastToRoom,
  close: close,
};

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

function broadcastToRoom(event, roomcode, data) {
  let socketlist = socketmap.get(roomcode);
  let command = {
    event: event,
    data: data,
  };
  for (let socket of socketlist) {
    socket.send(JSON.stringify(command));
  }
}

function connect(ws, request) {
  
  let scope = request.session.scope;
  const scopeId = scope.id;
  const roomcode = scope.roomcode;
  // socketmap.set(scopeId, ws);
  
  // if room doesnt exist, add first ws to it
  if (!socketmap.has(roomcode)) {
    socketmap.set(roomcode, [ws]);
  }
  else {
    // otherwise, add the websocket to this room
    let socketlist = socketmap.get(roomcode);
    let exists = socketlist.includes(ws);
    if (!exists) { socketlist.push(ws); }
  }
  
  ws.on('message', onMessage);
  ws.on('close', onClose);

  ////////////////////////////////////

  function onMessage(message) {

    // Assume messages are in JSON and attempt to parse
    // This is probably use for commands
    try {
      let data = JSON.parse(message);
      data.user = scope.id;
      console.log(`Received message ${message} from user ${scopeId}`);
      ws.send(JSON.stringify(data));
    }

    // Otherwise, treat it as regular text message
    // This is probably use for chatting
    catch(e) {
      console.log(`Received message ${message} from user ${scopeId}`);
      let data = {
        timestamp: Date.now(),
        username: scope.username,
        roomcode: scope.roomcode,
        message: message,
      };
      // ws.send(JSON.stringify(data));
      let socketlist = socketmap.get(roomcode);
      for (let socket of socketlist) {
        socket.send(JSON.stringify(data));
      }
    }
  }

  function onClose() {
    // socketmap.delete(scopeId);
    let socketlist = socketmap.get(roomcode);
    let index = socketlist.indexOf(ws);
    if (index >= 0) { socketlist.splice(index,1); }
  }
};
