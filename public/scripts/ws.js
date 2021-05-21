
(function () {

  if (localStorage['username']) {
    $('#username').val(localStorage['username']);
  }

  function showMessage(message) {
    // messages.textContent += `\n${message}`;
    // messages.scrollTop = messages.scrollHeight;
  }

  function disableLoginForm(data) {
    $('#loginform').hide();
    $('#roominfo').show();
    $('#chatbox').show();
    localStorage['username'] = $('#username').val();
  }

  function openChatBox() {
    $('#chatbox').show();
  }

  function closeChatBox() {
    $('#chatbox').hide();
  }

  function updateUserList(data) {
    $('#userlist').empty();
    $('#userlist').append(`
      <li class="person focus">
        <span class="title">${data.host}</span>
        <span class="preview">Host Im da boss!</span>
      </li>`);
    for (let username of data.users) {
      if (username !== data.host) {
        $('#userlist').append(`
          <li class="person">
            <span class="title">${username}</span>
            <span class="preview">Just a regular member</span>
          </li>`);
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
    
    let message = $('#messages').val();
    ws.send(message);
    $('#messagebox').html('');
  });

})();