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
        <choosen-words>
          <p>???</p>
          <p>???</p>
        </choosen-words>
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
        console.log(data);
        disableLoginForm(data);
        updateUserList(data);
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
      },
      error: (error) => {
        console.log(error.responseJSON);
        showMessage(error.responseText);
      }
    });
  });
  
  let selectedMap = {};
  let selectedCards = [];

  function drawMyCards(cards) {
    
    let username = $('#username').val();
    $(`#${username} choosen-words`).hide();
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
    let cards = $(`${selector}  choosen-words p`).toArray();
    if (cards.length) {
      cards[0].innerHTML = customer.cards[0];
      cards[1].innerHTML = customer.cards[1];
    }
  }


  $('#test').click(() => {
    $('#mycards').empty();
    let fakecards = ['meat','cake','veggie','fruits','five','mastecard','seven-eleven'];
    for (let card of fakecards) {
      
      let div = document.createElement('div');
      div.className = 'card asButton';
      div.innerHTML = 
      `<div class="card-text" style="display:flex;">
          <div class="desc">${card}</div>
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
      let data = event.detail.data;
      console.log(data);
      
      $('#startbtn').prop("disabled",true);
      
      // showMessage(JSON.stringify(event.detail.data));
      drawCustomer(data.customer);
      let username = $('#username').val();
      if (username !== data.customer.name) {
        drawMyCards(data.cards);
      }
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