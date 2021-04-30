
let roomcode;

function getUser() {
  // This is for getting your own information
  $.get(`/room/user`, function(session) {
    console.log(session);
    $('#me').html(session.user);
    $('#gameroom').html(session.room);
    if (!session.isCreator) {
      $('#startbtn').remove();
    }
  });
}

function getUsers() {
  // this is for getting list of ALL users
  $.get(`/room/users`, function(users) {
    console.log(users);
    $('#users').empty();
    for (let n = 0; n < users.length; n++) {
      let user = users[n];
      $('#users').append(`<li>${user}</li>`);
    }
  });
}

function startGame() {
  $.get(`/game/start`, function(status) {
    console.log(status);
  });
}

function getCards() {

}

getUser();
getUsers();

// polling
setInterval(getUsers, 5000);
