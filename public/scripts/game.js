
const socket = io();
const sessionId = localStorage.getItem('sessionId');

socket.emit('OnRoomEnter', sessionId, (session) => {
  console.log(session);
  $('#username').html(`Welcome ${session.name}!`);
  $('#gameroom').html(`Room Code: ${session.room}`);
  if (session.isCreator) { $('#startbtn').show(); }
  else { $('#startbtn').hide(); }
});

// when other users join this room
// add their names to the users list
socket.on('OnUsersEnterOrExit', (users) => {
  console.log('Got to OnUsersEnterOrExit!');
  console.log(users);
  $('#users').empty();
  users.sort();
  for (let user of users) {
    $('#users').append(`<li class="list-group-item">${user}</li>`);
  }
});

function exitRoom() {
  socket.emit('OnRoomExit', 'bogus', (status) => {
    console.log("User left the room!");
  });
}

window.addEventListener('beforeunload', function(e) {
  console.log("User is leaving the room!");
  exitRoom();
});
