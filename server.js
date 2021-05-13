
const session = require('express-session');
const express = require('express');
const parser = require('body-parser');
const http = require('http');
const routers = require('./routers');
const socket = require('./middlewares/socket');

const app = express();
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

app.use(express.static('public'));
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());
app.use(sessionParser);
app.use(routers);

const port = 80;
const server = http.createServer(app);
server.on('upgrade', socket.upgrade(sessionParser));
server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
