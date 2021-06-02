
const WordWolf = require('../games/wordwolf');
const Room = require('../models/room');

const room = new Room('Willy Pilly');
room.addUser('Darin Garen');
room.addUser('Chancey is Dancy');

let game1 = new WordWolf(room);

let req1 = { session: { scope: { username: 'Darin Garen' } } };
game1.addWordPair(req1, ['science','not science']);

let req2 = { session: { scope: { username: 'Chancey is Dancy' } } };
game1.addWordPair(req2, ['unmath','math']);

game1.selectWordPair();

console.log(game1.toString());

console.log(game1);
