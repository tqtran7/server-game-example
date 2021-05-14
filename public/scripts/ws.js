(function () {

  const messages = document.querySelector('#messages');
  const wsButton = document.querySelector('#wsButton');
  const wsSendButton = document.querySelector('#wsSendButton');
  const msgsendbtn = document.querySelector('#msgsendbtn');
  const messagebox = document.querySelector('#messagebox');
  const logout = document.querySelector('#logout');
  const login = document.querySelector('#login');

  if (localStorage['username']) {
    $('#username').val(localStorage['username']);
  }

  function showMessage(message) {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
  }

  function handleResponse(res) {
    console.log(res);
    return res.statusCode >= 200 && res.statusCode <= 300
      ? res.json().then((data) => JSON.stringify(data, null, 2))
      : Promise.reject(new Error('Unrecognizable response'));
  }

  function disableLoginForm(data) {
    $('#createbtn').prop( "disabled", true);
    $('#joinbtn').prop( "disabled", true);
    $('#username').prop( "disabled", true);
    $('#roomcode').prop( "disabled", true);
    $('#roomcode').val(data.roomcode);
    if (!localStorage['username']) {
      localStorage['username'] = username;
    }
  }

  function updateUserList(data) {
    $('#userlist').empty();
    $('#userlist').append(`<li class="active">${data.host}</li>`);
    for (let username of data.users) {
      if (username !== data.host) {
        $('#userlist').append(`<li>${username}</li>`);
      }
    }
  }

  $('#createbtn').click(function() {
    let username = $('#username').val();
    $.ajax({
      method: 'POST',
      url: '/room/create',
      json: true,
      data: { username },
      success: (data) => {
        disableLoginForm(data);
        updateUserList(data);
        showMessage(JSON.stringify(data, null, 2));
        connectWebsocket();
      },
      error: (error) => {
        console.log(error.responseJSON);
        showMessage(error.responseText);
      }
    });
  });

  $('#joinbtn').click(function() {
    let username = $('#username').val();
    let roomcode = $('#roomcode').val();
    $.ajax({
      method: 'POST',
      url: '/room/join',
      json: true,
      data: { username, roomcode },
      success: (data) => {
        disableLoginForm(data);
        updateUserList(data);
        showMessage(JSON.stringify(data, null, 2));
        connectWebsocket();
      },
      error: (error) => {
        console.log(error.responseJSON);
        showMessage(error.responseText);
      }
    });
  });

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
  function connectWebsocket() {
    
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    console.log(location);
    ws = new WebSocket(`ws://localhost:80`);
    
    ws.onerror = function () {
      showMessage('WebSocket connection error');
    };
    
    ws.onopen = function () {
      showMessage('WebSocket connection established');
    };

    // attempt to parse string into command
    // if successful, we broadcast event
    // otherwise, it is just a simple chat message
    ws.onmessage = function(res) {
      let detail = res.data;
      showMessage(detail);
      try { detail = JSON.parse(detail); }
      catch (e) { console.log(e); }
      console.log(typeof detail);
      if (typeof detail === 'object') {
        let e = new CustomEvent(detail.event, { detail });
        console.log(`Dispatching event ${detail.event}`);
        ws.dispatchEvent(e);
      }
    };

    ws.onclose = function () {
      showMessage('WebSocket connection closed');
      ws = null;
    };

    ws.addEventListener('OnUsersJoined', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      updateUserList(event.detail.data);
    });

    // ws.addEventListener('OnChatMessage')
  };

  $('#msgsendbtn').click(() => {

    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }
    
    let message = messagebox.value;
    ws.send(message);
    messagebox.value = '';
  });

  wsSendButton.onclick = function sendJSON() {

    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }

    let data = { room: 'abc', data: { a:1, b:2 } };
    let message = JSON.stringify(data);
    ws.send(message);
    // showMessage('Sent "Hello World!"');
  };

})();