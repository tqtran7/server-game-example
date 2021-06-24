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
      // $('#players').append(`
      // <player id="${username}">
      //   <name-container>
      //     <button disabled>${username}</button>
      //   </name-container>
      //   <words style="display:none;"></words>
      // </player>`);
      let player = document.createElement('player');
      let namecontainer = document.createElement('name-container');
      let button = document.createElement('button');
      let words = document.createElement('words');
      button.innerHTML = username;
      button.setAttribute('disabled', true);
      button.addEventListener('click', function() {
        tally(username);
      });
      namecontainer.append(button);
      player.append(namecontainer);
      player.append(words);
      $('#players').append(player);
    }
  }

/*
 homer works:

  1. Disable name buttons once voted
  2. Ensure that words are not blank and not the same

  3. Send a websocket event when some one vote
  4. Display this vote number next to names
  hint: trim()

  g = document.createElement('div');
g.setAttribute("id", "Div1");

*/

  function tally(username) {
    $('#players > player > name-container > button').prop("disabled", true);
    let roomcode = $('#roomcode').val();
    let data = JSON.stringify({
      roomcode: roomcode,
      action: 'tally',
      actionData: username,
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
  }

  //on click on name: disable all name button, tally()

  /*
  function createButtons(domId, numberOfButtons) {
        for (let n = 0; n < numberOfButtons; n++) {
          // domId.innerHTML += `<button onclick="dosomething()">Button ${n}</button>`;
          // $(domId).append(`<button onclick="dosomething()">Button ${n}</button>`);
          let button = document.createElement('button');
          button.innerHTML = `Button ${n}`;
          button.addEventListener('click', function() {
            dosomething(n);
          });
          $(domId).append(button);
        }
      }


      let button = document.createElement('button');
       button.innerHTML = `Button ${n}`;
       button.addEventListener('click', function() {
         dosomething(n);
       });

       let span = document.createElement('span');
       let div = document.createElement('div');
       div.append(span);
       div.append(button);

       $(domId).append(div);
  */

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
    let roomcode = $('#roomcode').val();
    let word1 = $('#playersWord1').val().trim();
    let word2 = $('#playersWord2').val().trim();
    let words = [word1, word2];
    if (!(word1 == word2) && !(word1 == "") && !(word2 == "")){
      $('#readybtn').prop("disabled", true);
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
    }
  });

  function startTimer(player) {
    let time = 10;
    let timerDom = $('#gamescreen > navbar > timer');
    timerDom.show();
    let timer = setInterval(function() {
      time--;
      timerDom.html(`${time}s`);
      console.log(`Timer @${time}`);
      if (time === 0) {
        clearInterval(timer);
        $('#players > player > name-container > button').prop("disabled", false);
        timerDom.html("Bye Felicia!");
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

    ws.addEventListener('OnTallyVote', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      let data = event.detail.data;
      console.log(data);
      console.log('why dis no work');
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
      $('#startbtn').prop("disabled", true);
      $('#wordPairForm').hide();
      $('#players').show();
      console.log(`${event.detail.event} Event Triggered!`);
      let data = event.detail.data;
      console.log(data);
      //append.div.word
      $('#gamescreen > word').html(data.word);
      startTimer(data.userid);
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
