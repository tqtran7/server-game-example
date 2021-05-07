
const path = require('path');
const express = require('express');
const parser = require('body-parser');

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;

const { MemoryStore } = require("./utils/stores");
const session = require('./middlewares/session');
const game = require('./games/snakeoil');
const store = new MemoryStore();

app.use(express.static('public'));
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/home.html');
  res.sendFile(filepath);
});

app.get('/game', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/game.html');
  res.sendFile(filepath);
});

io.use(session(store));
io.on("connection", game(store));
server.listen(port, () => console.log(`Server started on ${port}`));
