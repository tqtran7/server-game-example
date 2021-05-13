
const WebSocket = require('ws');

//////////////////////////

const map = new Map();
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
module.exports = { upgrade: upgrade };

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
  }
}

function connect(ws, request) {
  
  const scopeId = request.session.scope.id;
  map.set(scopeId, ws);
  ws.on('message', onMessage);
  ws.on('close', onClose);

  ////////////////////////////////////

  function onMessage(message) {
    
    let scope = request.session.scope;

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
      ws.send(JSON.stringify(data));
    }
  }

  function onClose() {
    map.delete(scopeId);
  }
};
