
let user = 'Willy and Darin';
let userElement = document.getElementById('user');
let userIcon = document.getElementById('userIcon');

function greetings() {
  userElement.innerHTML = user;
}

// Make an AJAX call to the server to get a name
// Remember that AJAX only works on the SAME domain
function getUser() {
  $.get('/user', function(data) {
    console.log(data);
    userElement.innerHTML = data.name;
    userIcon.src = `images/${data.icon}.png`;
  });
}

greetings();
