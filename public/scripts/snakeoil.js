
function createRoom() {
  let username = $("#name").val();
  let data = { username: username };
  console.log(data);
  $.ajax({
    method: 'POST',
    url: '/login',
    json: true,
    data: data,
    success: (status) => { 
      console.log(status);
      connectSocket();
    },
    error: (error) => { console.log(error); },
  });
}

function joinRoom() {
  let username = $("#name").val();
  let roomcode = $("#room").val();
  $.ajax({
    method: 'POST',
    url: '/login',
    json: true,
    data: { username: username, roomcode: roomcode },
    success: (status) => { 
      console.log(status); 
      connectSocket();
    },
    error: (error) => { console.log(error); },
  });
}

function connectSocket() {

  const messages = document.querySelector('#messages');
  const wsButton = document.querySelector('#wsButton');
  const wsSendButton = document.querySelector('#wsSendButton');
  const logout = document.querySelector('#logout');
  const login = document.querySelector('#login');

  function showMessage(message) {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
  }

  function handleResponse(response) {
    return response.ok
      ? response.json().then((data) => JSON.stringify(data, null, 2))
      : Promise.reject(new Error('Unexpected response'));
  }

  login.onclick = function () {
    fetch('/login', { method: 'POST', credentials: 'same-origin' })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };

  logout.onclick = function () {
    fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };

  let ws;

  wsButton.onclick = function () {
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    ws = new WebSocket(`ws://${location.host}`);
    ws.onerror = function () {
      showMessage('WebSocket error');
    };
    ws.onopen = function () {
      showMessage('WebSocket connection established');
    };
    ws.onclose = function () {
      showMessage('WebSocket connection closed');
      ws = null;
    };
  };

  wsSendButton.onclick = function () {
    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }

    ws.send('Hello World!');
    showMessage('Sent "Hello World!"');
  };

  // const socket = new WebSocket('ws://localhost:3000');
  // socket.addEventListener('open', function (event) {
  //     socket.send('Hello Server!');
  // });
  // socket.addEventListener('message', function (event) {
  //     console.log('Message from server ', event.data);
  // });

  // socket.onopen = function(event) {
  //   socket.send('hello world!');
  // };

  // socket.emit('OnRoomEnter', (session) => {
  //   console.log(session);
  //   $('#username').html(`Welcome ${session.name}!`);
  //   $('#gameroom').html(`Room Code: ${session.room}`);
  //   if (session.isCreator) { $('#startbtn').show(); }
  //   else { $('#startbtn').hide(); }
  // });

// // when other users join this room
// // add their names to the users list
// socket.on('OnUsersEnterOrExit', (users) => {
//   console.log('Got to OnUsersEnterOrExit!');
//   console.log(users);
//   $('#users').empty();
//   users.sort();
//   for (let user of users) {
//     $('#users').append(`<li class="list-group-item">${user}</li>`);
//   }
// });

// function exitRoom() {
//   socket.emit('OnRoomExit', 'bogus', (status) => {
//     console.log("User left the room!");
//   });
// }

// window.addEventListener('beforeunload', function(e) {
//   console.log("User is leaving the room!");
//   exitRoom();
// });
}