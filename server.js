
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const parser = require('body-parser')
const path = require('path');
const app = express();
const port = 3000;

const persons = require('./data/person');
const descriptor = require('./data/descriptor');
const gadget = require('./data/gadget');

app.use(express.static('public'));
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());
app.use(session({ secret: 'h2kld903hasdfl3' }));

let games = {};

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/home.html');
  console.log(filepath);
  res.sendFile(filepath);
});

app.get('/game', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/game.html');
  console.log(filepath);
  res.sendFile(filepath);
});

app.post('/game/create', (req, res) => {
  // generate random room code
  let creator = req.body.user;
  let roomcode = crypto.randomBytes(2).toString('hex');
  games[roomcode] = { users: [creator] };
  req.session.user = creator;
  req.session.room = roomcode;
  req.session.isCreator = true;
  res.send(roomcode);
});

app.get('/game/start', (req, res) => {

  // they pick 2/7 to make a sales pitch
  // 30(s) sales pitch on why customer should pick yours
  // customer picks somebody and sales person gets a point
  // then everything will reset and new round begins
  let room = req.session.room;
  let users = games[room].users;
  let game = {};

  // reshuffle these too!
  let pclone = JSON.parse(JSON.stringify(persons));
  let dclone = JSON.parse(JSON.stringify(descriptor));
  let gclone = JSON.parse(JSON.stringify(gadget));

  // 1 player randomly chosen as customer,
  // and given a descriptor and person
  let rand = Math.floor(Math.random() * users.length);
  let customer = users[rand];
  let cards = [pclone.pop(), dclone.pop()];
  game[customer] = { cards: cards };

  let deck = [...pclone, ...dclone, ...gclone];
  // reshuffle(deck);

  // everyone else is given 7 cards
  for (let player of users) {
    if (player != customer) {
      let cards = deck.splice(0, 7);
      game[player] = { cards: cards };
    }
  }

  games[room].game = game;
  console.log(game);
  res.send('game started!');
});

app.get('/game/cards', (req, res) => {
  let roomcode = req.session.room;
  let user = req.session.user;
  let game = games[roomcode].game;
  if (game) { res.send(game[user].cards); }
  else { res.status(400).send('Game not found!'); }
});

app.get('/room/user', (req, res) => {
  res.send(req.session);
});

app.get('/room/users', (req, res) => {
  let roomcode = req.session.room;
  res.send(games[roomcode].users);
});

app.post('/room/:roomcode/join', (req, res) => {
  let player = req.body.user;
  let roomcode = req.params.roomcode;
  if (games[roomcode] && player) {
    games[roomcode].users.push(player);
    req.session.user = player;
    req.session.room = roomcode;
    req.session.isCreator = false;
    res.send(roomcode);
  }
  else {
    res.status(400).send('Not a valid room code');
  }
});

app.listen(port, () => {
  console.log(`Snake Oil listening at http://localhost:${port}`);
});
