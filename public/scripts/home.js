
function createGame() {
  let user = $("#name").val();
  $.ajax({
    type: "POST",
    url: "/game/create",
    data: { user: user },
    json: true,
    success: function(roomcode) {
      console.log(roomcode);
      window.location = '/game';
    }
  });
}

function joinGame() {
  let roomcode = $('#room').val();
  let user = $("#name").val();
  $.ajax({
    type: "POST",
    url: `/room/${roomcode}/join`,
    data: { user: user },
    json: true,
    success: function(roomcode) {
      window.location = '/game';
    },
    error: function(error) {
      console.log(error);
      $('#errormessage').html(error);
    }
  });
}
