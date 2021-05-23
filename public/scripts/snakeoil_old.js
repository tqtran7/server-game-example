
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

  $('#startbtn').click(function() {
    let roomcode = $('#roomcode').val();
    let gamename = 'snakeoil';
    $.ajax({
      method: 'POST',
      url: '/room/start',
      json: true,
      data: { gamename, roomcode },
      success: (data) => {
        console.log(data);
        showMessage(JSON.stringify(data, null, 2));
      },
      error: (error) => {
        console.log(error.responseJSON);
        showMessage(error.responseText);
      }
    });
  });

  function drawMyCards(cards) {
    $('#mycards').empty();
    for (let card of cards) {
      let html = 
      `<div class="card">
        <div class="card-text" style="display:flex;">
          <div class="title-total">
            <div class="desc">${card}</div>
          </div>
        </div>
      </div>`;
      $('#mycards').append(html);
    }
  }

  function drawCustomer(customer) {
    let html = 
    `<div class="card">
      <div class="card-text">
        <div class="portada"></div>
        <div class="title-total">
          <h2>${customer.name}</h2>
          <div class="desc">
            ${customer.cards[0]}
            ${customer.cards[1]}
          </div>
        </div>
      </div>
    </div>`;
    $('#gameboard').append(html);
  }


  let selectedMap = {};
  let selectedCards = [];
  $('#test').click(() => {
    $('#mycards').empty();
    let fakecards = ['meat','cake','veggie','fruits'];
    for (let card of fakecards) {
      
      let div = document.createElement('div');
      div.className = 'card asButton';
      div.innerHTML = 
      `<div class="card-text" style="display:flex;">
        <div class="title-total">
          <div class="desc">${card}</div>
        </div>
      </div>`;

      // cards are not selected by default
      selectedMap[card] = {
        selected: false,
        div: div
      };

      div.addEventListener('click', ()=>{

        // user toggled the selection state of card
        selectedMap[card].selected = !selectedMap[card].selected;

        // user clicked on a card and selected it
        if (selectedMap[card].selected) {

          // only two cards can be selected at a time
          // force remove the oldest selected one
          if (selectedCards.length >= 2) { 
            let unselected = selectedCards.shift();
            selectedMap[unselected].selected = false;
            selectedMap[unselected].div.className = 'card asButton';
          }

          // quota hasnt been met
          // just keep adding until we get there
          selectedCards.push(card);
          selectedMap[card].div.className = 'card asButton selected';
        }

        // user clicked on a selected item to unselect it
        // remove it from selected cards
        else {
          selectedMap[card].div.className = 'card asButton';
          let index = selectedCards.indexOf(card);
          if (index >= 0) { selectedCards.splice(index, 1); }
        }

        console.log(selectedCards);
      });
      $('#mycards').append(div);
    }
  });

  function selectCard(dom) {
    let value = $(dom).find('.desc').html();
    console.log(value);
  }

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

    ws.addEventListener('OnGameStart', (event) => {
      console.log(`${event.detail.event} Event Triggered!`);
      console.log(event.detail.data);
      showMessage(JSON.stringify(event.detail.data));
      drawMyCards(event.detail.data.cards);
      drawCustomer(event.detail.data.customer);
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