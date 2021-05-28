(function () {

  let selectedMap = {};
  let selectedCards = [];

  if (localStorage['username']) {
    $('#username').val(localStorage['username']);
  }

  function disableLoginForm(data) {
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
        <selected>
          <p>???</p>
          <p>???</p>
          <p class="timer" style="display:none;">30s</p>
        </selected>
      </player>`);
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
        connectWebsocket();
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
    let roomcode = $('#roomcode').val();
    let gamename = 'snakeoil';
    $.ajax({
      method: 'POST',
      url: '/room/start',
      json: true,
      data: { gamename, roomcode },
      error: (error) => {
        console.log(error.responseJSON);
      }
    });
  });

  $('#pitchbtn').click(function() {
    let roomcode = $('#roomcode').val();
    let data = JSON.stringify({
      roomcode: roomcode,
      action: 'pitch',
      actionData: selectedCards,
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

  function drawMyCards(cards) {
    
    let username = $('#username').val();
    $(`#${username} selected`).hide();
    let words = $(`#${username} words`);
    words.show();
    words.empty();
    selectedMap = {};
    selectedCards = [];

    for (let card of cards) {
      
      let p = document.createElement('p');
      p.innerHTML = card;
      words.append(p);

      // cards are not selected by default
      selectedMap[card] = { selected: false, element: p };

      p.addEventListener('click', ()=>{

        // user toggled the selection state of card
        selectedMap[card].selected = !selectedMap[card].selected;

        // user clicked on a card and selected it
        if (selectedMap[card].selected) {

          // only two cards can be selected at a time
          // force remove the oldest selected one
          if (selectedCards.length >= 2) { 
            let unselected = selectedCards.shift();
            selectedMap[unselected].selected = false;
            selectedMap[unselected].element.className = '';
          }

          // quota hasnt been met
          // just keep adding until we get there
          selectedCards.push(card);
          selectedMap[card].element.className = 'selected';
        }

        // user clicked on a selected item to unselect it
        // remove it from selected cards
        else {
          selectedMap[card].element.className = '';
          let index = selectedCards.indexOf(card);
          if (index >= 0) { selectedCards.splice(index, 1); }
        }

        console.log(selectedCards);
      }); 
    }
  }

  function drawCustomer(customer) {
    let selector = `#${customer.name}`;
    $(selector).addClass('customer');
    drawSelected(customer);
  }

  function drawSelected(player) {
    let selector = `#${player.name}`;
    $(`${selector} words`).hide();
    $(`${selector} selected`).show();
    let cards = $(`${selector} selected p`).toArray();
    if (cards.length) {
      cards[0].innerHTML = player.cards[0];
      cards[1].innerHTML = player.cards[1];
    }
  }

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
    let endpoint = windown.location.host === 'localhost' ?
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
      
      $('#startbtn').prop("disabled",true);

      drawCustomer(data.customer);
      let username = $('#username').val();
      if (username !== data.customer.name) {
        drawMyCards(data.cards);
      }
    });

    ws.addEventListener('OnPlayerPitch', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      let player = event.detail.data;
      console.log(player);
      drawSelected(player);
      startTimer(player);
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