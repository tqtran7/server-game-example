
//
// getUser();
// getUsers();
//
// // polling
// let getUsersPoller = setInterval(getUsers, 5000);
// let getCardsPoller = setInterval(getCards, 5000);
//
// function getUser() {
//   // This is for getting your own information
//   $.get(`/room/user`, function(session) {
//     console.log(session);
//     $('#me').html(session.user);
//     $('#gameroom').html(session.room);
//     if (!session.isCreator) {
//       $('#startbtn').remove();
//     }
//   });
// }
//
// function startGame() {
//   $.get(`/game/start`, function(status) {
//     console.log(status);
//   });
// }
//
// function getCards() {
//   $.get(`/game/cards`, function(cards) {
//     $('#cards').empty();
//     for (let n = 0; n < cards.length; n++) {
//       let card = cards[n];
//       $('#cards').append(`<li>${card}</li>`);
//     }
//     clearInterval(getCardsPoller);
//   });
// }
//

const socket = io();
const sessionId = localStorage.getItem('sessionId');

socket.emit('OnRoomEnter', sessionId, (session) => {
  console.log(session);
  $('#username').html(`Welcome ${session.name}!`);
  $('#gameroom').html(`Room Code: ${session.room}`);
  if (session.isCreator) { $('#startbtn').show(); }
  else { $('#startbtn').hide(); }
});

// when other users join this room
// add their names to the users list
socket.on('OnUsersEnterOrExit', (users) => {
  console.log('Got to OnUsersEnterOrExit!');
  console.log(users);
  $('#users').empty();
  users.sort();
  for (let user of users) {
    $('#users').append(`<li class="list-group-item">${user}</li>`);
  }
});

// function getUsers() {
//   // this is for getting list of ALL users
//   $.get(`/room/users`, function(users) {
//     console.log(users);
//     $('#users').empty();
//     for (let n = 0; n < users.length; n++) {
//       let user = users[n];
//       $('#users').append(`<li>${user}</li>`);
//     }
//   });
// }
