
(function () {

  const messages = document.querySelector('#messages');
  const messagebox = document.querySelector('#messagebox');

  if (localStorage['username']) {
    $('#username').val(localStorage['username']);
  }

  function showMessage(message) {
    messages.textContent += `\n${message}`;
    messages.scrollTop = messages.scrollHeight;
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
    $('#userlist').append(`
      <li class="active">
        <i class="fas fa-user-cog"></i>
        <span class="username">${data.host}</span>
      </li>
    `);
    for (let username of data.users) {
      if (username !== data.host) {
        $('#userlist').append(`
          <li>
            <i class="fas fa-user"></i>
            <span class="username">${username}</span>
          </li>
        `);
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
        console.log(data);
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

  let ws;
  function connectWebsocket() {
    
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    console.log(location);
    ws = new WebSocket(`ws://localhost:80`);
    ws.onerror = () => { showMessage('WebSocket connection error'); };
    ws.onopen  = () => { showMessage('WebSocket connection established'); };
    ws.onclose = () => {
      showMessage('WebSocket connection closed');
      ws = null;
    };

    ws.onmessage = function(res) {
      console.log(res.data);
      try { 
        let detail = JSON.parse(res.data);
        if (typeof detail === 'object') {
          let event = new CustomEvent(detail.event, { detail });
          ws.dispatchEvent(event);
        }
      }
      catch (e) { console.log(e); }
    };

    ws.addEventListener('OnChatMessage', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      showMessage(JSON.stringify(event.detail.data));
    });

    ws.addEventListener('OnUsersUpdate', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      updateUserList(event.detail.data);
    });
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

})();