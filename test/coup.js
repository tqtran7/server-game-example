
const Coup = require('../games/coup');
const Room = require('../models/room');

const room = new Room('Willy Pilly');
room.addUser('Darin Garen');
room.addUser('Chance Mance');

let game1 = new Coup(room);
console.log(game1.toString());

game1.deal();

let req1 = { session: { scope: { username: 'Darin Garen' } } };

game1.review();
game1.exchange(req1, 'Darin Garen');
game1.review();
