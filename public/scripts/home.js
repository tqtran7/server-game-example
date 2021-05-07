
const socket = io();

function createRoom() {
  let username = $("#name").val();
  socket.emit('OnRoomCreate', username, (res) => {
    if (res.sessionId) {
      localStorage.setItem('sessionId', res.sessionId);
      window.location = '/game';
    }
  });
}

function joinRoom() {
  let username = $("#name").val();
  let roomcode = $("#room").val();
  socket.emit('OnRoomJoinRequest', username, roomcode, (res) => {
    if (res.sessionId) {
      localStorage.setItem('sessionId', res.sessionId);
      window.location = '/game';
    }
  });
}
