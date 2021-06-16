(function () {

  let selectedMap = {};
  let selectedCards = [];

  if (localStorage['username']) {
    $('#username').val(localStorage['username']);
  }

  function disableLoginForm(data) {
    $('#pitchbtn').prop("disabled", true);
    $('#loginscreen').hide();
    $('#gamescreen').show();
    $('#roomcode').val(data.roomcode);
    $('#roomcodedisplay').html(`Room Code: ${data.roomcode}`);
    localStorage['username'] = $('#username').val();
  }

  function updateUserList(data) {
    $('#players').empty();
    for (let username of data.users) {
      $('#players').append(`
      <player id="${username}">
        <name-container>
          <name>${username}</name>
        </name-container>
        <words style="display:none;"></words>
      </player>`);
    }
  }

  $('#createbtn').click(function() {
    let gamename = 'wordwolf';
    let username = $('#username').val();
    $.ajax({
      method: 'POST',
      url: '/room/create',
      json: true,
      data: { username, gamename },
      success: (data) => {
        console.log(data);
        disableLoginForm(data);
        updateUserList(data);
        connectWebsocket();
        //startGame();
      },
      error: (error) => {
        console.log(error.responseJSON);
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
        console.log(data);
        disableLoginForm(data);
        updateUserList(data);
        connectWebsocket();
      },
      error: (error) => {
        console.log(error.responseJSON);
      }
    });
  });

  $('#startbtn').click(function() {
    $('#startbtn').prop("disabled", true);
    let roomcode = $('#roomcode').val();
    let data = JSON.stringify({
      roomcode: roomcode,
      gamename: 'wordwolf',
    });
    console.log(data);
    $.ajax({
      method: 'POST',
      url: '/room/start',
      data: data,
      dataType: 'json',
      contentType:"application/json",
      error: (error) => {
        console.log(error.responseJSON);
      }
    });
  });

  $('#readybtn').click(function() {
    $('#readybtn').prop("disabled", true);
    let roomcode = $('#roomcode').val();
    let word1 = $('#playersWord1').val();
    let word2 = $('#playersWord2').val();
    let words = [word1, word2];
    let data = JSON.stringify({
      roomcode: roomcode,
      action: 'addWordPair',
      actionData: words,
    });
    console.log(data);
    $.ajax({
      method: 'POST',
      url: '/room/action',
      data: data,
      dataType: 'json',
      contentType:"application/json",
      error: (error) => {
        console.log(error.responseJSON);
      }
    });
  });

  function startTimer(player) {
    let time = 30;
    let selector = `#${player.name}`;
    let timerDom = $(`${selector} selected .timer`);
    timerDom.show();
    let timer = setInterval(function() {
      time--;
      timerDom.html(`${time}s`);
      console.log(`Timer @${time}`);
      if (time === 0) {
        clearInterval(timer);
        timerDom.html("Pitched!");
        console.log(`Timer completed!`);
      }
    }, 1000);
  }

  let ws;
  function connectWebsocket() {

    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    console.log(location);
    let endpoint = window.location.host === 'localhost' ?
      `ws://${window.location.host}`:
      `wss://${window.location.host}`;
    ws = new WebSocket(endpoint);
    ws.onerror = () => { console.log('WebSocket connection error'); };
    ws.onopen  = () => { console.log('WebSocket connection established'); };
    ws.onclose = () => {
      console.log('WebSocket connection closed');
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
    });

    ws.addEventListener('OnUsersUpdate', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      updateUserList(event.detail.data);
    });

    ws.addEventListener('OnGameStart', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      let data = event.detail.data;
      console.log(data);

      $('#startbtn').prop("disabled", true);
      $('#pitchbtn').prop("disabled", false);

      drawCustomer(data.customer);
      let username = $('#username').val();
      if (username !== data.customer.name) {
        drawMyCards(data.cards);
      }
    });

    ws.addEventListener('OnAssignCards', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      let word = event.detail.data;
      console.log(word);
    });
  };

  $('#msgsendbtn').click(() => {

    if (!ws) {
      console.log('No WebSocket connection');
      return;
    }

    let message = $('#messages').val();
    ws.send(message);
    $('#messagebox').html('');
  });

})();
