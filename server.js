
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const users = [
  { name: 'Uncle Thai', icon: 'elixir' },
  { name: 'Willy Pilly', icon: 'gem' },
  { name: 'Darin Jerin', icon: 'bread' },
  { name: 'Chancey Mancey', icon: 'poison' },
  { name: 'Justin Wustin', icon: 'lettuce' },
];

app.use(express.static('public'));

app.get('/', (req, res) => {
  let filepath = path.join(__dirname + '/public/pages/home.html');
  console.log(filepath);
  res.sendFile(filepath);
});

app.get('/user', (req, res) => {
  let rand = Math.floor(Math.random() * users.length);
  res.send(users[rand]);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
